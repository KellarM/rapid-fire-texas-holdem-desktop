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

      // Board win rates: wins / rounds where player actually placed a bet on that board
      const withCardBet  = settled.filter(e => Object.keys(e.hand_bets || {}).some(k => (e.hand_bets[k] || 0) > 0));
      const withRankBet  = settled.filter(e => Object.keys(e.rank_bets || {}).some(k => (e.rank_bets[k] || 0) > 0));
      const withColorBet = settled.filter(e => Object.keys(e.color_bets || {}).some(k => (e.color_bets[k] || 0) > 0));
      const withRiverBet = settled.filter(e => (e.low_high_bet?.amount || 0) > 0);

      // A card win means the player bet on a hand AND that hand won
      const cardWins  = withCardBet.filter(e => {
        const winnerIds = e.winner_hand_ids || [];
        return winnerIds.some(wid => (e.hand_bets[wid] || 0) > 0);
      }).length;
      const rankWins  = withRankBet.filter(e => e.rank_win).length;
      const colorWins = withColorBet.filter(e => e.color_win).length;
      const riverWins = withRiverBet.filter(e => e.river_win).length;

      const cardWinRate  = withCardBet.length  > 0 ? cardWins  / withCardBet.length  : null;
      const rankWinRate  = withRankBet.length  > 0 ? rankWins  / withRankBet.length  : null;
      const colorWinRate = withColorBet.length > 0 ? colorWins / withColorBet.length : null;
      const riverWinRate = withRiverBet.length > 0 ? riverWins / withRiverBet.length : null;

      // Kill switch = rounds where the side bet gate was CLOSED (rank bets didn't match hand bets),
      // meaning the player could NOT access color or river boards
      // We detect this as: player had card + rank bets but NO color or river bets AND gate was not open
      // Stored as kill_switch_active in the event data
      const killSwitchRounds = settled.filter(e => e.kill_switch_active).length;
      // Also: rounds where player had hand+rank bets but gate was closed (rank != hand total) — no color/river bets placed
      const gateClosedRounds = settled.filter(e => {
        const hasHand  = Object.keys(e.hand_bets || {}).some(k => (e.hand_bets[k] || 0) > 0);
        const hasRank  = Object.keys(e.rank_bets || {}).some(k => (e.rank_bets[k] || 0) > 0);
        const hasColor = Object.keys(e.color_bets || {}).some(k => (e.color_bets[k] || 0) > 0);
        const hasRiver = (e.low_high_bet?.amount || 0) > 0;
        // Had hand and rank but gate was intentionally or inadvertently closed (no color/river)
        return hasHand && hasRank && !hasColor && !hasRiver;
      }).length;
      const killSwitchRate = totalRounds > 0 ? (killSwitchRounds + gateClosedRounds) / totalRounds : 0;

      // ── Betting Pattern Breakdown ─────────────────────────────────────────
      // Categorize each round by which boards the player bet on
      const bettingPatterns = { cardsOnly: 0, cardsRank: 0, cardsRankColor: 0, cardsRankRiver: 0, allFour: 0, other: 0 };
      settled.forEach(e => {
        const hasHand  = Object.keys(e.hand_bets || {}).some(k => (e.hand_bets[k] || 0) > 0);
        const hasRank  = Object.keys(e.rank_bets || {}).some(k => (e.rank_bets[k] || 0) > 0);
        const hasColor = Object.keys(e.color_bets || {}).some(k => (e.color_bets[k] || 0) > 0);
        const hasRiver = (e.low_high_bet?.amount || 0) > 0;
        if (hasHand && hasRank && hasColor && hasRiver) bettingPatterns.allFour++;
        else if (hasHand && hasRank && hasColor && !hasRiver) bettingPatterns.cardsRankColor++;
        else if (hasHand && hasRank && !hasColor && hasRiver) bettingPatterns.cardsRankRiver++;
        else if (hasHand && hasRank && !hasColor && !hasRiver) bettingPatterns.cardsRank++;
        else if (hasHand && !hasRank) bettingPatterns.cardsOnly++;
        else bettingPatterns.other++;
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