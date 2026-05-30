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

      const cardWins     = settled.filter(e => e.card_win).length;
      const rankWins     = settled.filter(e => e.rank_win).length;
      const colorWins    = settled.filter(e => e.color_win).length;
      const riverWins    = settled.filter(e => e.river_win).length;

      const withRankBet  = settled.filter(e => e.rank_win !== undefined && Object.keys(e.rank_bets || {}).length > 0).length;
      const withColorBet = settled.filter(e => Object.keys(e.color_bets || {}).length > 0).length;
      const withRiverBet = settled.filter(e => e.low_high_bet?.amount > 0).length;

      const cardWinRate  = cardWins / totalRounds;
      const rankWinRate  = withRankBet > 0 ? rankWins / withRankBet : 0;
      const colorWinRate = withColorBet > 0 ? colorWins / withColorBet : 0;
      const riverWinRate = withRiverBet > 0 ? riverWins / withRiverBet : 0;

      const killSwitchRounds = settled.filter(e => e.kill_switch_active).length;
      const killSwitchRate   = killSwitchRounds / totalRounds;

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
        killSwitchRate,
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