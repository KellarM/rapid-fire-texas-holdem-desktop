import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, eventData } = body;

    // ── Save event ─────────────────────────────────────────────────────────
    if (action === 'saveEvent') {
      const record = await base44.asServiceRole.entities.GameEvent.create(eventData);
      return Response.json({ ok: true, id: record.id });
    }

    // ── Summary ────────────────────────────────────────────────────────────
    if (action === 'summary') {
      const events = await base44.asServiceRole.entities.GameEvent.list('-created_date', 1000);
      const settled = events.filter(e => e.event_type === 'round_settled');

      if (settled.length === 0) return Response.json(null);

      const totalRounds  = settled.length;
      const totalBet     = settled.reduce((s, e) => s + (e.total_bet || 0), 0);
      const totalPayout  = settled.reduce((s, e) => s + (e.total_payout || 0), 0);
      const netResult    = totalPayout - totalBet;
      const houseEdge    = totalBet > 0 ? (totalBet - totalPayout) / totalBet : 0;
      const avgBet       = totalBet / totalRounds;
      const avgPayout    = totalPayout / totalRounds;
      const wins         = settled.filter(e => (e.total_payout || 0) > (e.total_bet || 0)).length;
      const winRate      = wins / totalRounds;

      // Helper: safely check if an object field has any positive value
      // Handles cases where the field may be stored as a nested object or be null/undefined
      const hasBet = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        return Object.values(obj).some(v => Number(v) > 0);
      };
      const hasRiverBet = (e) => {
        const lh = e.low_high_bet;
        if (!lh) return false;
        if (typeof lh === 'object') return Number(lh.amount || 0) > 0;
        return false;
      };

      // Board win rates: wins / rounds where player actually placed a bet on that board
      const withCardBet  = settled.filter(e => hasBet(e.hand_bets));
      const withRankBet  = settled.filter(e => hasBet(e.rank_bets));
      const withColorBet = settled.filter(e => hasBet(e.color_bets));
      const withRiverBet = settled.filter(e => hasRiverBet(e));

      // Card win: player bet on a winning hand (their specific bet hand won)
      const cardWins  = withCardBet.filter(e => {
        const winnerIds = (e.winner_hand_ids || []).map(String);
        return winnerIds.some(wid => Number(e.hand_bets[wid] || e.hand_bets[Number(wid)] || 0) > 0);
      }).length;
      // Rank win: player had a rank bet and it matched the winning rank
      const rankWins  = withRankBet.filter(e => !!e.rank_win).length;
      // Color win: player had a color bet and a winning color matched their bet key
      const colorWins = withColorBet.filter(e => {
        const winColors = e.winning_colors || [];
        return winColors.some(wc => Number(e.color_bets[wc] || 0) > 0);
      }).length;
      // River win: player had a river bet and won
      const riverWins = withRiverBet.filter(e => !!e.river_win).length;

      const cardWinRate  = withCardBet.length  > 0 ? cardWins  / withCardBet.length  : null;
      const rankWinRate  = withRankBet.length  > 0 ? rankWins  / withRankBet.length  : null;
      const colorWinRate = withColorBet.length > 0 ? colorWins / withColorBet.length : null;
      const riverWinRate = withRiverBet.length > 0 ? riverWins / withRiverBet.length : null;

      // Kill switch: rounds where player had hand+rank bets but no color or river (gate was closed)
      const killSwitchRounds = settled.filter(e => e.kill_switch_active).length;
      const gateClosedRounds = settled.filter(e => {
        return hasBet(e.hand_bets) && hasBet(e.rank_bets) && !hasBet(e.color_bets) && !hasRiverBet(e);
      }).length;
      const killSwitchRate = totalRounds > 0 ? (killSwitchRounds + gateClosedRounds) / totalRounds : 0;

      // ── Betting Pattern Breakdown ─────────────────────────────────────────
      const bettingPatterns = { cardsOnly: 0, cardsRank: 0, cardsRankColor: 0, cardsRankRiver: 0, allFour: 0, other: 0 };
      settled.forEach(e => {
        const hasHand  = hasBet(e.hand_bets);
        const hasRank  = hasBet(e.rank_bets);
        const hasColor = hasBet(e.color_bets);
        const hasRiver = hasRiverBet(e);
        if (!hasHand) { bettingPatterns.other++; return; }
        if (hasHand && hasRank && hasColor && hasRiver) bettingPatterns.allFour++;
        else if (hasHand && hasRank && hasColor)        bettingPatterns.cardsRankColor++;
        else if (hasHand && hasRank && hasRiver)        bettingPatterns.cardsRankRiver++;
        else if (hasHand && hasRank)                    bettingPatterns.cardsRank++;
        else                                            bettingPatterns.cardsOnly++;
      });

      // Rank breakdown
      const rankBreakdown = {};
      settled.forEach(e => {
        if (e.winning_rank) {
          rankBreakdown[e.winning_rank] = (rankBreakdown[e.winning_rank] || 0) + 1;
        }
      });

      // Color breakdown
      const colorBreakdown = {};
      settled.forEach(e => {
        (e.winning_colors || []).forEach(c => {
          colorBreakdown[c] = (colorBreakdown[c] || 0) + 1;
        });
      });

      // River breakdown
      const riverBreakdown = { LOW: 0, HIGH: 0 };
      settled.forEach(e => {
        if (e.winning_low_high === 'LOW') riverBreakdown.LOW++;
        if (e.winning_low_high === 'HIGH') riverBreakdown.HIGH++;
      });

      // Hand win breakdown
      const handWinBreakdown = {};
      settled.forEach(e => {
        (e.winner_hand_ids || []).forEach(hid => {
          handWinBreakdown[hid] = (handWinBreakdown[hid] || 0) + 1;
        });
      });

      // Hand bet breakdown
      const handBetBreakdown = {};
      settled.forEach(e => {
        Object.keys(e.hand_bets || {}).forEach(hid => {
          if ((e.hand_bets[hid] || 0) > 0) {
            handBetBreakdown[hid] = (handBetBreakdown[hid] || 0) + 1;
          }
        });
      });

      return Response.json({
        totalRounds, totalBet, totalPayout, netResult, houseEdge,
        avgBet, avgPayout, winRate,
        cardWinRate, rankWinRate, colorWinRate, riverWinRate,
        withCardBetCount: withCardBet.length,
        withRankBetCount: withRankBet.length,
        withColorBetCount: withColorBet.length,
        withRiverBetCount: withRiverBet.length,
        killSwitchRate,
        bettingPatterns,
        rankBreakdown, colorBreakdown, riverBreakdown,
        handWinBreakdown, handBetBreakdown,
      });
    }

    // ── Clear ──────────────────────────────────────────────────────────────
    if (action === 'clear') {
      const events = await base44.asServiceRole.entities.GameEvent.list('-created_date', 1000);
      await Promise.all(events.map(e => base44.asServiceRole.entities.GameEvent.delete(e.id)));
      return Response.json({ ok: true, deleted: events.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});