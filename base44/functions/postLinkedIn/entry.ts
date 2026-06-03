import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

    // Get the user's LinkedIn profile ID (sub = person URN)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();
    const personUrn = `urn:li:person:${profile.sub}`;

    const postText = `🚀 Rapid Fire Texas Hold'em — Analytics Update

We've been busy improving our game analytics dashboard! Here's what's new:

📊 Board Breakdown — New 2×2 tables showing Games, Wins, Win Rate & Avg Payout for every board type (Color, Rank, River)

🃏 Player Hand Bets — Hands tab now shows per-hand betting stats with real card labels instead of generic "Hand N" labels

✅ Win Tracking Fixes — Rank, Color, and River wins now use exact-match logic for more accurate reporting

🔤 Improved Readability — Font sizes bumped up across the analytics panel for a cleaner experience

Building smarter tools for a smarter game. More updates coming soon! 🎴

#GamingTech #PokerGame #ProductUpdate #RapidFire #Analytics`;

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: postText },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      return Response.json({ error: err }, { status: postRes.status });
    }

    const result = await postRes.json();
    return Response.json({ success: true, postId: result.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});