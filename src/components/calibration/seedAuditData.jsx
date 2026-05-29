// Pre-loaded audit results from RapidFire_CertAudit_2026-05-14
// All 70 bets: Carded Hands, Hand Ranks — exact PDF data.
// Color Board: real PDF data (all pass). River Board: placeholder pass values (re-run to refresh).
export const SEED_AUDIT_DATA = {
  // ─────────────────────────────────────────────────────────────────────────
  // QUICK CHECK  (100,000 rounds/bet · Internal Pre-Flight · 93%–99%)
  // ─────────────────────────────────────────────────────────────────────────
  quick: {
    // Carded Hands
    "hand:1":  { wins:4531,  perHandRankHandWins:null, actualRounds:100000,  winFrequency:4.531,  rtp:96.51, liveOdds:"20.3:1", for965:"20.3:1",  passed:true, status:"complete" },
    "hand:2":  { wins:17807, perHandRankHandWins:null, actualRounds:100000,  winFrequency:17.807, rtp:95.27, liveOdds:"4.35:1", for965:"4.42:1",  passed:true, status:"complete" },
    "hand:3":  { wins:5720,  perHandRankHandWins:null, actualRounds:100000,  winFrequency:5.72,   rtp:96.10, liveOdds:"15.8:1", for965:"15.87:1", passed:true, status:"complete" },
    "hand:4":  { wins:9501,  perHandRankHandWins:null, actualRounds:100000,  winFrequency:9.501,  rtp:95.01, liveOdds:"9:1",    for965:"9.16:1",  passed:true, status:"complete" },
    "hand:5":  { wins:11511, perHandRankHandWins:null, actualRounds:100000,  winFrequency:11.511, rtp:96.69, liveOdds:"7.4:1",  for965:"7.38:1",  passed:true, status:"complete" },
    "hand:6":  { wins:14064, perHandRankHandWins:null, actualRounds:100000,  winFrequency:14.064, rtp:97.04, liveOdds:"5.9:1",  for965:"5.86:1",  passed:true, status:"complete" },
    "hand:7":  { wins:12141, perHandRankHandWins:null, actualRounds:100000,  winFrequency:12.141, rtp:94.70, liveOdds:"6.8:1",  for965:"6.95:1",  passed:true, status:"complete" },
    "hand:8":  { wins:11515, perHandRankHandWins:null, actualRounds:100000,  winFrequency:11.515, rtp:95.57, liveOdds:"7.3:1",  for965:"7.38:1",  passed:true, status:"complete" },
    "hand:9":  { wins:9464,  perHandRankHandWins:null, actualRounds:100000,  winFrequency:9.464,  rtp:95.59, liveOdds:"9.1:1",  for965:"9.2:1",   passed:true, status:"complete" },
    "hand:10": { wins:5638,  perHandRankHandWins:null, actualRounds:100000,  winFrequency:5.638,  rtp:94.72, liveOdds:"15.8:1", for965:"16.12:1", passed:true, status:"complete" },
    // Hand Ranks — H1 (A♦10♥)
    "perHandRank:1:Full House":     { wins:25013, perHandRankHandWins:100000, actualRounds:2225301, winFrequency:25.013, rtp:96.55, liveOdds:"2.86:1",  for965:"2.86:1",  passed:true, status:"complete" },
    "perHandRank:1:Two Pair":       { wins:22838, perHandRankHandWins:100000, actualRounds:2224445, winFrequency:22.838, rtp:98.20, liveOdds:"3.3:1",   for965:"3.23:1",  passed:true, status:"complete" },
    "perHandRank:1:Straight":       { wins:22232, perHandRankHandWins:100000, actualRounds:2233906, winFrequency:22.232, rtp:95.82, liveOdds:"3.31:1",  for965:"3.34:1",  passed:true, status:"complete" },
    "perHandRank:1:Flush":          { wins:14907, perHandRankHandWins:100000, actualRounds:2225197, winFrequency:14.907, rtp:97.64, liveOdds:"5.55:1",  for965:"5.47:1",  passed:true, status:"complete" },
    "perHandRank:1:Three of a Kind":{ wins:10530, perHandRankHandWins:100000, actualRounds:2229063, winFrequency:10.530, rtp:96.45, liveOdds:"8.16:1",  for965:"8.16:1",  passed:true, status:"complete" },
    "perHandRank:1:One Pair":       { wins:3198,  perHandRankHandWins:100000, actualRounds:2228924, winFrequency:3.198,  rtp:93.38, liveOdds:"28.2:1",  for965:"29.18:1", passed:true, status:"complete" },
    // Hand Ranks — H2 (K♣K♠)
    "perHandRank:2:Full House":     { wins:41344, perHandRankHandWins:100000, actualRounds:555143, winFrequency:41.344, rtp:96.75, liveOdds:"1.34:1",  for965:"1.33:1",  passed:true, status:"complete" },
    "perHandRank:2:Three of a Kind":{ wins:36850, perHandRankHandWins:100000, actualRounds:556330, winFrequency:36.850, rtp:96.92, liveOdds:"1.63:1",  for965:"1.62:1",  passed:true, status:"complete" },
    "perHandRank:2:Four of a Kind": { wins:11326, perHandRankHandWins:100000, actualRounds:558326, winFrequency:11.326, rtp:97.74, liveOdds:"7.63:1",  for965:"7.52:1",  passed:true, status:"complete" },
    "perHandRank:2:Flush":          { wins:6961,  perHandRankHandWins:100000, actualRounds:555104, winFrequency:6.961,  rtp:95.16, liveOdds:"12.67:1", for965:"12.86:1", passed:true, status:"complete" },
    "perHandRank:2:One Pair":       { wins:2589,  perHandRankHandWins:100000, actualRounds:555232, winFrequency:2.589,  rtp:98.49, liveOdds:"37.04:1", for965:"36.27:1", passed:true, status:"complete" },
    "perHandRank:2:Straight":       { wins:1335,  perHandRankHandWins:100000, actualRounds:555860, winFrequency:1.335,  rtp:94.78, liveOdds:"70:1",    for965:"71.28:1", passed:true, status:"complete" },
    // Hand Ranks — H3 (Q♣J♠)
    "perHandRank:3:Straight":       { wins:55825, perHandRankHandWins:100000, actualRounds:1761666, winFrequency:55.825, rtp:97.14, liveOdds:"0.74:1", for965:"0.73:1",  passed:true, status:"complete" },
    "perHandRank:3:Full House":     { wins:18266, perHandRankHandWins:100000, actualRounds:1756681, winFrequency:18.266, rtp:96.63, liveOdds:"4.29:1", for965:"4.28:1",  passed:true, status:"complete" },
    "perHandRank:3:Two Pair":       { wins:15591, perHandRankHandWins:100000, actualRounds:1752749, winFrequency:15.591, rtp:96.20, liveOdds:"5.17:1", for965:"5.19:1",  passed:true, status:"complete" },
    "perHandRank:3:Three of a Kind":{ wins:10380, perHandRankHandWins:100000, actualRounds:1767328, winFrequency:10.380, rtp:94.98, liveOdds:"8.15:1", for965:"8.3:1",   passed:true, status:"complete" },
    // Hand Ranks — H4 (Q♠10♠)
    "perHandRank:4:Flush":          { wins:54788, perHandRankHandWins:100000, actualRounds:1041888, winFrequency:54.788, rtp:95.88, liveOdds:"0.75:1",  for965:"0.76:1",  passed:true, status:"complete" },
    "perHandRank:4:Straight":       { wins:31697, perHandRankHandWins:100000, actualRounds:1043026, winFrequency:31.697, rtp:95.72, liveOdds:"2.02:1",  for965:"2.04:1",  passed:true, status:"complete" },
    "perHandRank:4:Full House":     { wins:9858,  perHandRankHandWins:100000, actualRounds:1040736, winFrequency:9.858,  rtp:97.99, liveOdds:"8.94:1",  for965:"8.79:1",  passed:true, status:"complete" },
    "perHandRank:4:Two Pair":       { wins:3614,  perHandRankHandWins:100000, actualRounds:1047731, winFrequency:3.614,  rtp:94.54, liveOdds:"25.45:1", for965:"25.7:1",  passed:true, status:"complete" },
    // Hand Ranks — H5 (J♣9♣)
    "perHandRank:5:Flush":          { wins:45708, perHandRankHandWins:100000, actualRounds:871995, winFrequency:45.708, rtp:96.44, liveOdds:"1.11:1",  for965:"1.11:1",  passed:true, status:"complete" },
    "perHandRank:5:Straight":       { wins:21393, perHandRankHandWins:100000, actualRounds:870084, winFrequency:21.393, rtp:96.91, liveOdds:"3.53:1",  for965:"3.51:1",  passed:true, status:"complete" },
    "perHandRank:5:Full House":     { wins:16679, perHandRankHandWins:100000, actualRounds:869003, winFrequency:16.679, rtp:95.74, liveOdds:"4.74:1",  for965:"4.79:1",  passed:true, status:"complete" },
    "perHandRank:5:Three of a Kind":{ wins:8022,  perHandRankHandWins:100000, actualRounds:872546, winFrequency:8.022,  rtp:94.74, liveOdds:"10.81:1", for965:"11.03:1", passed:true, status:"complete" },
    "perHandRank:5:Two Pair":       { wins:4525,  perHandRankHandWins:100000, actualRounds:872765, winFrequency:4.525,  rtp:96.16, liveOdds:"20.25:1", for965:"20.33:1", passed:true, status:"complete" },
    "perHandRank:5:Four of a Kind": { wins:1720,  perHandRankHandWins:100000, actualRounds:867926, winFrequency:1.720,  rtp:94.60, liveOdds:"54:1",    for965:"55.1:1",  passed:true, status:"complete" },
    // Hand Ranks — H6 (8♦6♦)
    "perHandRank:6:Flush":          { wins:37795, perHandRankHandWins:100000, actualRounds:716416, winFrequency:37.795, rtp:96.76, liveOdds:"1.56:1",  for965:"1.55:1",  passed:true, status:"complete" },
    "perHandRank:6:Straight":       { wins:21391, perHandRankHandWins:100000, actualRounds:717024, winFrequency:21.391, rtp:96.47, liveOdds:"3.51:1",  for965:"3.51:1",  passed:true, status:"complete" },
    "perHandRank:6:Full House":     { wins:20397, perHandRankHandWins:100000, actualRounds:713650, winFrequency:20.397, rtp:97.50, liveOdds:"3.78:1",  for965:"3.73:1",  passed:true, status:"complete" },
    "perHandRank:6:Three of a Kind":{ wins:11057, perHandRankHandWins:100000, actualRounds:715145, winFrequency:11.057, rtp:96.53, liveOdds:"7.73:1",  for965:"7.73:1",  passed:true, status:"complete" },
    "perHandRank:6:Two Pair":       { wins:6249,  perHandRankHandWins:100000, actualRounds:719846, winFrequency:6.249,  rtp:94.55, liveOdds:"14.13:1", for965:"14.44:1", passed:true, status:"complete" },
    "perHandRank:6:Four of a Kind": { wins:2868,  perHandRankHandWins:100000, actualRounds:715995, winFrequency:2.868,  rtp:96.02, liveOdds:"32.48:1", for965:"32.65:1", passed:true, status:"complete" },
    // Hand Ranks — H7 (7♦7♠)
    "perHandRank:7:Full House":     { wins:44304, perHandRankHandWins:100000, actualRounds:805180, winFrequency:44.304, rtp:96.14, liveOdds:"1.17:1",  for965:"1.18:1",  passed:true, status:"complete" },
    "perHandRank:7:Three of a Kind":{ wins:31243, perHandRankHandWins:100000, actualRounds:801942, winFrequency:31.243, rtp:97.17, liveOdds:"2.11:1",  for965:"2.09:1",  passed:true, status:"complete" },
    "perHandRank:7:Four of a Kind": { wins:15865, perHandRankHandWins:100000, actualRounds:810026, winFrequency:15.865, rtp:95.82, liveOdds:"5.04:1",  for965:"5.08:1",  passed:true, status:"complete" },
    "perHandRank:7:Straight":       { wins:8214,  perHandRankHandWins:100000, actualRounds:803614, winFrequency:8.214,  rtp:96.02, liveOdds:"10.69:1", for965:"10.75:1", passed:true, status:"complete" },
    // Hand Ranks — H8 (4♥2♥)
    "perHandRank:8:Flush":          { wins:44389, perHandRankHandWins:100000, actualRounds:858777, winFrequency:44.389, rtp:96.32, liveOdds:"1.17:1",  for965:"1.17:1",  passed:true, status:"complete" },
    "perHandRank:8:Full House":     { wins:15754, perHandRankHandWins:100000, actualRounds:860281, winFrequency:15.754, rtp:97.04, liveOdds:"5.16:1",  for965:"5.13:1",  passed:true, status:"complete" },
    "perHandRank:8:Straight":       { wins:14344, perHandRankHandWins:100000, actualRounds:855314, winFrequency:14.344, rtp:94.24, liveOdds:"5.57:1",  for965:"5.73:1",  passed:true, status:"complete" },
    "perHandRank:8:Three of a Kind":{ wins:14375, perHandRankHandWins:100000, actualRounds:861217, winFrequency:14.375, rtp:96.31, liveOdds:"5.7:1",   for965:"5.71:1",  passed:true, status:"complete" },
    "perHandRank:8:Two Pair":       { wins:7283,  perHandRankHandWins:100000, actualRounds:854844, winFrequency:7.283,  rtp:97.81, liveOdds:"12.43:1", for965:"12.25:1", passed:true, status:"complete" },
    "perHandRank:8:Four of a Kind": { wins:3481,  perHandRankHandWins:100000, actualRounds:860152, winFrequency:3.481,  rtp:98.51, liveOdds:"27.3:1",  for965:"26.72:1", passed:true, status:"complete" },
    // Hand Ranks — H9 (3♣3♥)
    "perHandRank:9:Full House":     { wins:42112, perHandRankHandWins:100000, actualRounds:1050168, winFrequency:42.112, rtp:96.02, liveOdds:"1.28:1",  for965:"1.29:1",  passed:true, status:"complete" },
    "perHandRank:9:Three of a Kind":{ wins:30151, perHandRankHandWins:100000, actualRounds:1046069, winFrequency:30.151, rtp:96.78, liveOdds:"2.21:1",  for965:"2.2:1",   passed:true, status:"complete" },
    "perHandRank:9:Four of a Kind": { wins:20823, perHandRankHandWins:100000, actualRounds:1048930, winFrequency:20.823, rtp:96.41, liveOdds:"3.63:1",  for965:"3.63:1",  passed:true, status:"complete" },
    "perHandRank:9:Straight":       { wins:6120,  perHandRankHandWins:100000, actualRounds:1045274, winFrequency:6.120,  rtp:95.47, liveOdds:"14.6:1",  for965:"14.77:1", passed:true, status:"complete" },
    // Hand Ranks — H10 (A♥5♦)
    "perHandRank:10:Full House":     { wins:27444, perHandRankHandWins:100000, actualRounds:1751759, winFrequency:27.444, rtp:94.96, liveOdds:"2.46:1", for965:"2.52:1",  passed:true, status:"complete" },
    "perHandRank:10:Straight":       { wins:25140, perHandRankHandWins:100000, actualRounds:1755039, winFrequency:25.140, rtp:96.54, liveOdds:"2.84:1", for965:"2.84:1",  passed:true, status:"complete" },
    "perHandRank:10:Three of a Kind":{ wins:16471, perHandRankHandWins:100000, actualRounds:1752481, winFrequency:16.471, rtp:95.37, liveOdds:"4.79:1", for965:"4.86:1",  passed:true, status:"complete" },
    "perHandRank:10:Two Pair":       { wins:16318, perHandRankHandWins:100000, actualRounds:1741673, winFrequency:16.318, rtp:97.42, liveOdds:"4.97:1", for965:"4.91:1",  passed:true, status:"complete" },
    "perHandRank:10:Flush":          { wins:11083, perHandRankHandWins:100000, actualRounds:1752490, winFrequency:11.083, rtp:96.53, liveOdds:"7.71:1", for965:"7.71:1",  passed:true, status:"complete" },
    "perHandRank:10:Four of a Kind": { wins:3509,  perHandRankHandWins:100000, actualRounds:1755746, winFrequency:3.509,  rtp:93.55, liveOdds:"26.4:1", for965:"26.5:1",  passed:true, status:"complete" },
    // Color Board — real PDF data
    "color:3R": { wins:50064,  perHandRankHandWins:null, actualRounds:100000, winFrequency:50.064, rtp:95.62, liveOdds:"0.91:1", for965:"0.93:1", passed:true, status:"complete" },
    "color:3B": { wins:50021,  perHandRankHandWins:null, actualRounds:100000, winFrequency:50.021, rtp:95.54, liveOdds:"0.91:1", for965:"0.93:1", passed:true, status:"complete" },
    "color:4R": { wins:16665,  perHandRankHandWins:null, actualRounds:100000, winFrequency:16.665, rtp:95.82, liveOdds:"4.75:1", for965:"4.79:1", passed:true, status:"complete" },
    "color:4B": { wins:16707,  perHandRankHandWins:null, actualRounds:100000, winFrequency:16.707, rtp:96.07, liveOdds:"4.75:1", for965:"4.78:1", passed:true, status:"complete" },
    "color:5R": { wins:2210,   perHandRankHandWins:null, actualRounds:100000, winFrequency:2.210,  rtp:97.24, liveOdds:"43:1",   for965:"42.67:1", passed:true, status:"complete" },
    "color:5B": { wins:2152,   perHandRankHandWins:null, actualRounds:100000, winFrequency:2.152,  rtp:94.69, liveOdds:"43:1",   for965:"43.84:1", passed:true, status:"complete" },
    // River Board — removed bogus placeholder data; re-run required for accurate adaptive results
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PRE-SUBMISSION  (500,000 rounds/bet · House Internal Standard · 94%–98.5%)
  // ─────────────────────────────────────────────────────────────────────────
  presubmission: {
    // Carded Hands
    "hand:1":  { wins:22415, perHandRankHandWins:null, actualRounds:500000, winFrequency:4.483,  rtp:95.49, liveOdds:"20.3:1", for965:"20.53:1", passed:true, status:"complete" },
    "hand:2":  { wins:89712, perHandRankHandWins:null, actualRounds:500000, winFrequency:17.942, rtp:95.99, liveOdds:"4.35:1", for965:"4.38:1",  passed:true, status:"complete" },
    "hand:3":  { wins:28616, perHandRankHandWins:null, actualRounds:500000, winFrequency:5.723,  rtp:96.15, liveOdds:"15.8:1", for965:"15.86:1", passed:true, status:"complete" },
    "hand:4":  { wins:48044, perHandRankHandWins:null, actualRounds:500000, winFrequency:9.609,  rtp:96.09, liveOdds:"9:1",    for965:"9.04:1",  passed:true, status:"complete" },
    "hand:5":  { wins:57575, perHandRankHandWins:null, actualRounds:500000, winFrequency:11.515, rtp:96.73, liveOdds:"7.4:1",  for965:"7.38:1",  passed:true, status:"complete" },
    "hand:6":  { wins:69638, perHandRankHandWins:null, actualRounds:500000, winFrequency:13.928, rtp:96.10, liveOdds:"5.9:1",  for965:"5.93:1",  passed:true, status:"complete" },
    "hand:7":  { wins:62050, perHandRankHandWins:null, actualRounds:500000, winFrequency:12.410, rtp:96.80, liveOdds:"6.8:1",  for965:"6.78:1",  passed:true, status:"complete" },
    "hand:8":  { wins:58297, perHandRankHandWins:null, actualRounds:500000, winFrequency:11.659, rtp:96.77, liveOdds:"7.3:1",  for965:"7.28:1",  passed:true, status:"complete" },
    "hand:9":  { wins:47778, perHandRankHandWins:null, actualRounds:500000, winFrequency:9.556,  rtp:96.51, liveOdds:"9.1:1",  for965:"9.1:1",   passed:true, status:"complete" },
    "hand:10": { wins:28263, perHandRankHandWins:null, actualRounds:500000, winFrequency:5.653,  rtp:94.96, liveOdds:"15.8:1", for965:"16.07:1", passed:true, status:"complete" },
    // Hand Ranks — H1
    "perHandRank:1:Full House":     { wins:125093, perHandRankHandWins:500000, actualRounds:11102097, winFrequency:25.019, rtp:96.57, liveOdds:"2.86:1",  for965:"2.86:1",  passed:true, status:"complete" },
    "perHandRank:1:Two Pair":       { wins:112845, perHandRankHandWins:500000, actualRounds:11088718, winFrequency:22.569, rtp:97.05, liveOdds:"3.3:1",   for965:"3.28:1",  passed:true, status:"complete" },
    "perHandRank:1:Straight":       { wins:111173, perHandRankHandWins:500000, actualRounds:11111164, winFrequency:22.235, rtp:95.83, liveOdds:"3.31:1",  for965:"3.34:1",  passed:true, status:"complete" },
    "perHandRank:1:Flush":          { wins:73126,  perHandRankHandWins:500000, actualRounds:11106240, winFrequency:14.625, rtp:95.80, liveOdds:"5.55:1",  for965:"5.6:1",   passed:true, status:"complete" },
    "perHandRank:1:Three of a Kind":{ wins:52991,  perHandRankHandWins:500000, actualRounds:11093063, winFrequency:10.598, rtp:97.08, liveOdds:"8.16:1",  for965:"8.11:1",  passed:true, status:"complete" },
    "perHandRank:1:One Pair":       { wins:16283,  perHandRankHandWins:500000, actualRounds:11076148, winFrequency:3.257,  rtp:95.09, liveOdds:"28.2:1",  for965:"28.63:1", passed:true, status:"complete" },
    // Hand Ranks — H2
    "perHandRank:2:Full House":     { wins:205337, perHandRankHandWins:500000, actualRounds:2791976, winFrequency:41.067, rtp:96.10, liveOdds:"1.34:1",  for965:"1.35:1",  passed:true, status:"complete" },
    "perHandRank:2:Three of a Kind":{ wins:183827, perHandRankHandWins:500000, actualRounds:2786152, winFrequency:36.765, rtp:96.69, liveOdds:"1.63:1",  for965:"1.62:1",  passed:true, status:"complete" },
    "perHandRank:2:Four of a Kind": { wins:56341,  perHandRankHandWins:500000, actualRounds:2790633, winFrequency:11.268, rtp:97.24, liveOdds:"7.63:1",  for965:"7.56:1",  passed:true, status:"complete" },
    "perHandRank:2:Flush":          { wins:35187,  perHandRankHandWins:500000, actualRounds:2782194, winFrequency:7.037,  rtp:96.20, liveOdds:"12.67:1", for965:"12.71:1", passed:true, status:"complete" },
    "perHandRank:2:One Pair":       { wins:12687,  perHandRankHandWins:500000, actualRounds:2791082, winFrequency:2.537,  rtp:96.52, liveOdds:"37.04:1", for965:"37.03:1", passed:true, status:"complete" },
    "perHandRank:2:Straight":       { wins:6812,   perHandRankHandWins:500000, actualRounds:2790129, winFrequency:1.362,  rtp:96.73, liveOdds:"70:1",    for965:"69.83:1", passed:true, status:"complete" },
    // Hand Ranks — H3
    "perHandRank:3:Straight":       { wins:278285, perHandRankHandWins:500000, actualRounds:8777629, winFrequency:55.657, rtp:96.84, liveOdds:"0.74:1", for965:"0.73:1",  passed:true, status:"complete" },
    "perHandRank:3:Full House":     { wins:92122,  perHandRankHandWins:500000, actualRounds:8770783, winFrequency:18.424, rtp:97.47, liveOdds:"4.29:1", for965:"4.24:1",  passed:true, status:"complete" },
    "perHandRank:3:Two Pair":       { wins:77633,  perHandRankHandWins:500000, actualRounds:8775012, winFrequency:15.527, rtp:95.80, liveOdds:"5.17:1", for965:"5.22:1",  passed:true, status:"complete" },
    "perHandRank:3:Three of a Kind":{ wins:52217,  perHandRankHandWins:500000, actualRounds:8777076, winFrequency:10.443, rtp:95.56, liveOdds:"8.15:1", for965:"8.24:1",  passed:true, status:"complete" },
    // Hand Ranks — H4
    "perHandRank:4:Flush":          { wins:273981, perHandRankHandWins:500000, actualRounds:5196342, winFrequency:54.796, rtp:95.89, liveOdds:"0.75:1",  for965:"0.76:1",  passed:true, status:"complete" },
    "perHandRank:4:Straight":       { wins:158450, perHandRankHandWins:500000, actualRounds:5206622, winFrequency:31.690, rtp:95.70, liveOdds:"2.02:1",  for965:"2.05:1",  passed:true, status:"complete" },
    "perHandRank:4:Full House":     { wins:48279,  perHandRankHandWins:500000, actualRounds:5210402, winFrequency:9.656,  rtp:95.98, liveOdds:"8.94:1",  for965:"8.99:1",  passed:true, status:"complete" },
    "perHandRank:4:Two Pair":       { wins:18132,  perHandRankHandWins:500000, actualRounds:5223250, winFrequency:3.626,  rtp:94.87, liveOdds:"25.45:1", for965:"25.61:1", passed:true, status:"complete" },
    // Hand Ranks — H5
    "perHandRank:5:Flush":          { wins:228317, perHandRankHandWins:500000, actualRounds:4364627, winFrequency:45.663, rtp:96.35, liveOdds:"1.11:1",  for965:"1.11:1",  passed:true, status:"complete" },
    "perHandRank:5:Straight":       { wins:106455, perHandRankHandWins:500000, actualRounds:4353588, winFrequency:21.291, rtp:96.45, liveOdds:"3.53:1",  for965:"3.53:1",  passed:true, status:"complete" },
    "perHandRank:5:Full House":     { wins:83901,  perHandRankHandWins:500000, actualRounds:4360519, winFrequency:16.780, rtp:96.32, liveOdds:"4.74:1",  for965:"4.75:1",  passed:true, status:"complete" },
    "perHandRank:5:Three of a Kind":{ wins:40316,  perHandRankHandWins:500000, actualRounds:4354396, winFrequency:8.063,  rtp:95.23, liveOdds:"10.81:1", for965:"10.97:1", passed:true, status:"complete" },
    "perHandRank:5:Two Pair":       { wins:22886,  perHandRankHandWins:500000, actualRounds:4355999, winFrequency:4.577,  rtp:97.27, liveOdds:"20.25:1", for965:"20.08:1", passed:true, status:"complete" },
    "perHandRank:5:Four of a Kind": { wins:8809,   perHandRankHandWins:500000, actualRounds:4359951, winFrequency:1.762,  rtp:96.90, liveOdds:"54:1",    for965:"53.77:1", passed:true, status:"complete" },
    // Hand Ranks — H6
    "perHandRank:6:Flush":          { wins:189306, perHandRankHandWins:500000, actualRounds:3582290, winFrequency:37.861, rtp:96.92, liveOdds:"1.56:1",  for965:"1.55:1",  passed:true, status:"complete" },
    "perHandRank:6:Straight":       { wins:107099, perHandRankHandWins:500000, actualRounds:3586003, winFrequency:21.420, rtp:96.60, liveOdds:"3.51:1",  for965:"3.51:1",  passed:true, status:"complete" },
    "perHandRank:6:Full House":     { wins:101226, perHandRankHandWins:500000, actualRounds:3590158, winFrequency:20.245, rtp:96.77, liveOdds:"3.78:1",  for965:"3.77:1",  passed:true, status:"complete" },
    "perHandRank:6:Three of a Kind":{ wins:55471,  perHandRankHandWins:500000, actualRounds:3582838, winFrequency:11.094, rtp:96.85, liveOdds:"7.73:1",  for965:"7.7:1",   passed:true, status:"complete" },
    "perHandRank:6:Two Pair":       { wins:32267,  perHandRankHandWins:500000, actualRounds:3588421, winFrequency:6.453,  rtp:97.64, liveOdds:"14.13:1", for965:"13.95:1", passed:true, status:"complete" },
    "perHandRank:6:Four of a Kind": { wins:14277,  perHandRankHandWins:500000, actualRounds:3587483, winFrequency:2.855,  rtp:95.60, liveOdds:"32.48:1", for965:"32.8:1",  passed:true, status:"complete" },
    // Hand Ranks — H7
    "perHandRank:7:Full House":     { wins:220659, perHandRankHandWins:500000, actualRounds:4024106, winFrequency:44.132, rtp:95.77, liveOdds:"1.17:1",  for965:"1.19:1",  passed:true, status:"complete" },
    "perHandRank:7:Three of a Kind":{ wins:156186, perHandRankHandWins:500000, actualRounds:4035176, winFrequency:31.237, rtp:97.15, liveOdds:"2.11:1",  for965:"2.09:1",  passed:true, status:"complete" },
    "perHandRank:7:Four of a Kind": { wins:79634,  perHandRankHandWins:500000, actualRounds:4012045, winFrequency:15.927, rtp:96.20, liveOdds:"5.04:1",  for965:"5.06:1",  passed:true, status:"complete" },
    "perHandRank:7:Straight":       { wins:40919,  perHandRankHandWins:500000, actualRounds:4020659, winFrequency:8.184,  rtp:95.67, liveOdds:"10.69:1", for965:"10.79:1", passed:true, status:"complete" },
    // Hand Ranks — H8
    "perHandRank:8:Flush":          { wins:223154, perHandRankHandWins:500000, actualRounds:4290902, winFrequency:44.631, rtp:96.85, liveOdds:"1.17:1",  for965:"1.16:1",  passed:true, status:"complete" },
    "perHandRank:8:Full House":     { wins:78436,  perHandRankHandWins:500000, actualRounds:4289958, winFrequency:15.687, rtp:96.63, liveOdds:"5.16:1",  for965:"5.15:1",  passed:true, status:"complete" },
    "perHandRank:8:Straight":       { wins:72642,  perHandRankHandWins:500000, actualRounds:4284175, winFrequency:14.528, rtp:95.45, liveOdds:"5.57:1",  for965:"5.64:1",  passed:true, status:"complete" },
    "perHandRank:8:Three of a Kind":{ wins:71950,  perHandRankHandWins:500000, actualRounds:4288081, winFrequency:14.390, rtp:96.41, liveOdds:"5.7:1",   for965:"5.71:1",  passed:true, status:"complete" },
    "perHandRank:8:Two Pair":       { wins:35749,  perHandRankHandWins:500000, actualRounds:4285703, winFrequency:7.150,  rtp:96.02, liveOdds:"12.43:1", for965:"12.5:1",  passed:true, status:"complete" },
    "perHandRank:8:Four of a Kind": { wins:17176,  perHandRankHandWins:500000, actualRounds:4288297, winFrequency:3.435,  rtp:97.22, liveOdds:"27.3:1",  for965:"27.09:1", passed:true, status:"complete" },
    // Hand Ranks — H9
    "perHandRank:9:Full House":     { wins:211952, perHandRankHandWins:500000, actualRounds:5257189, winFrequency:42.390, rtp:96.65, liveOdds:"1.28:1",  for965:"1.28:1",  passed:true, status:"complete" },
    "perHandRank:9:Three of a Kind":{ wins:151028, perHandRankHandWins:500000, actualRounds:5246341, winFrequency:30.206, rtp:96.96, liveOdds:"2.21:1",  for965:"2.19:1",  passed:true, status:"complete" },
    "perHandRank:9:Four of a Kind": { wins:104477, perHandRankHandWins:500000, actualRounds:5239245, winFrequency:20.895, rtp:96.75, liveOdds:"3.63:1",  for965:"3.62:1",  passed:true, status:"complete" },
    "perHandRank:9:Straight":       { wins:30278,  perHandRankHandWins:500000, actualRounds:5242711, winFrequency:6.056,  rtp:94.47, liveOdds:"14.6:1",  for965:"14.94:1", passed:true, status:"complete" },
    // Hand Ranks — H10
    "perHandRank:10:Full House":     { wins:137768, perHandRankHandWins:500000, actualRounds:8764405, winFrequency:27.554, rtp:95.34, liveOdds:"2.46:1", for965:"2.5:1",   passed:true, status:"complete" },
    "perHandRank:10:Straight":       { wins:125394, perHandRankHandWins:500000, actualRounds:8800827, winFrequency:25.079, rtp:96.30, liveOdds:"2.84:1", for965:"2.85:1",  passed:true, status:"complete" },
    "perHandRank:10:Three of a Kind":{ wins:83449,  perHandRankHandWins:500000, actualRounds:8757046, winFrequency:16.690, rtp:96.63, liveOdds:"4.79:1", for965:"4.78:1",  passed:true, status:"complete" },
    "perHandRank:10:Two Pair":       { wins:81715,  perHandRankHandWins:500000, actualRounds:8767707, winFrequency:16.343, rtp:97.57, liveOdds:"4.97:1", for965:"4.9:1",   passed:true, status:"complete" },
    "perHandRank:10:Flush":          { wins:54490,  perHandRankHandWins:500000, actualRounds:8772935, winFrequency:10.898, rtp:94.92, liveOdds:"7.71:1", for965:"7.85:1",  passed:true, status:"complete" },
    "perHandRank:10:Four of a Kind": { wins:17477,  perHandRankHandWins:500000, actualRounds:8769428, winFrequency:3.495,  rtp:95.77, liveOdds:"26.4:1", for965:"26.61:1", passed:true, status:"complete" },
    // Color Board — real PDF data
    "color:3R": { wins:250599, perHandRankHandWins:null, actualRounds:500000, winFrequency:50.120, rtp:95.73, liveOdds:"0.91:1", for965:"0.93:1", passed:true, status:"complete" },
    "color:3B": { wins:249658, perHandRankHandWins:null, actualRounds:500000, winFrequency:49.932, rtp:95.37, liveOdds:"0.91:1", for965:"0.93:1", passed:true, status:"complete" },
    "color:4R": { wins:83271,  perHandRankHandWins:null, actualRounds:500000, winFrequency:16.654, rtp:95.76, liveOdds:"4.75:1", for965:"4.79:1", passed:true, status:"complete" },
    "color:4B": { wins:83460,  perHandRankHandWins:null, actualRounds:500000, winFrequency:16.692, rtp:95.98, liveOdds:"4.75:1", for965:"4.78:1", passed:true, status:"complete" },
    "color:5R": { wins:10933,  perHandRankHandWins:null, actualRounds:500000, winFrequency:2.187,  rtp:96.21, liveOdds:"43:1",   for965:"43.13:1", passed:true, status:"complete" },
    "color:5B": { wins:10752,  perHandRankHandWins:null, actualRounds:500000, winFrequency:2.150,  rtp:95.69, liveOdds:"43:1",   for965:"43.88:1", passed:true, status:"complete" },
    // River Board — removed bogus placeholder data; re-run required for accurate adaptive results
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GLI / BMM  (1,000,000 rounds/bet · GLI-11 / BMM Technical · 95%–98%)
  // ─────────────────────────────────────────────────────────────────────────
  gli: {
    // Carded Hands
    "hand:1":  { wins:45187,  perHandRankHandWins:null, actualRounds:1000000, winFrequency:4.519,  rtp:96.25, liveOdds:"20.3:1", for965:"20.36:1", passed:true, status:"complete" },
    "hand:2":  { wins:179632, perHandRankHandWins:null, actualRounds:1000000, winFrequency:17.963, rtp:96.10, liveOdds:"4.35:1", for965:"4.37:1",  passed:true, status:"complete" },
    "hand:3":  { wins:56878,  perHandRankHandWins:null, actualRounds:1000000, winFrequency:5.688,  rtp:95.56, liveOdds:"15.8:1", for965:"15.97:1", passed:true, status:"complete" },
    "hand:4":  { wins:95834,  perHandRankHandWins:null, actualRounds:1000000, winFrequency:9.583,  rtp:95.83, liveOdds:"9:1",    for965:"9.07:1",  passed:true, status:"complete" },
    "hand:5":  { wins:114776, perHandRankHandWins:null, actualRounds:1000000, winFrequency:11.478, rtp:96.41, liveOdds:"7.4:1",  for965:"7.41:1",  passed:true, status:"complete" },
    "hand:6":  { wins:139227, perHandRankHandWins:null, actualRounds:1000000, winFrequency:13.923, rtp:96.07, liveOdds:"5.9:1",  for965:"5.93:1",  passed:true, status:"complete" },
    "hand:7":  { wins:123816, perHandRankHandWins:null, actualRounds:1000000, winFrequency:12.382, rtp:96.58, liveOdds:"6.8:1",  for965:"6.79:1",  passed:true, status:"complete" },
    "hand:8":  { wins:116772, perHandRankHandWins:null, actualRounds:1000000, winFrequency:11.677, rtp:96.92, liveOdds:"7.3:1",  for965:"7.26:1",  passed:true, status:"complete" },
    "hand:9":  { wins:95026,  perHandRankHandWins:null, actualRounds:1000000, winFrequency:9.503,  rtp:95.98, liveOdds:"9.1:1",  for965:"9.16:1",  passed:true, status:"complete" },
    "hand:10": { wins:57370,  perHandRankHandWins:null, actualRounds:1000000, winFrequency:5.737,  rtp:96.38, liveOdds:"15.8:1", for965:"15.82:1", passed:true, status:"complete" },
    // Hand Ranks — H1
    "perHandRank:1:Full House":     { wins:251494, perHandRankHandWins:1000000, actualRounds:22195366, winFrequency:25.149, rtp:97.08, liveOdds:"2.86:1",  for965:"2.84:1",  passed:true, status:"complete" },
    "perHandRank:1:Two Pair":       { wins:226206, perHandRankHandWins:1000000, actualRounds:22223024, winFrequency:22.621, rtp:97.27, liveOdds:"3.3:1",   for965:"3.27:1",  passed:true, status:"complete" },
    "perHandRank:1:Straight":       { wins:221946, perHandRankHandWins:1000000, actualRounds:22195768, winFrequency:22.195, rtp:95.66, liveOdds:"3.31:1",  for965:"3.35:1",  passed:true, status:"complete" },
    "perHandRank:1:Flush":          { wins:146944, perHandRankHandWins:1000000, actualRounds:22234002, winFrequency:14.694, rtp:96.25, liveOdds:"5.55:1",  for965:"5.57:1",  passed:true, status:"complete" },
    "perHandRank:1:Three of a Kind":{ wins:105684, perHandRankHandWins:1000000, actualRounds:22195535, winFrequency:10.568, rtp:96.81, liveOdds:"8.16:1",  for965:"8.13:1",  passed:true, status:"complete" },
    "perHandRank:1:One Pair":       { wins:33049,  perHandRankHandWins:1000000, actualRounds:22203980, winFrequency:3.305,  rtp:96.50, liveOdds:"28.2:1",  for965:"28.2:1",  passed:true, status:"complete" },
    // Hand Ranks — H2
    "perHandRank:2:Full House":     { wins:411050, perHandRankHandWins:1000000, actualRounds:5577965, winFrequency:41.105, rtp:96.19, liveOdds:"1.34:1",  for965:"1.35:1",  passed:true, status:"complete" },
    "perHandRank:2:Three of a Kind":{ wins:367760, perHandRankHandWins:1000000, actualRounds:5568960, winFrequency:36.776, rtp:96.72, liveOdds:"1.63:1",  for965:"1.62:1",  passed:true, status:"complete" },
    "perHandRank:2:Four of a Kind": { wins:112356, perHandRankHandWins:1000000, actualRounds:5572690, winFrequency:11.236, rtp:96.96, liveOdds:"7.63:1",  for965:"7.59:1",  passed:true, status:"complete" },
    "perHandRank:2:Flush":          { wins:69974,  perHandRankHandWins:1000000, actualRounds:5584981, winFrequency:6.997,  rtp:95.65, liveOdds:"12.67:1", for965:"12.79:1", passed:true, status:"complete" },
    "perHandRank:2:One Pair":       { wins:25282,  perHandRankHandWins:1000000, actualRounds:5573098, winFrequency:2.528,  rtp:96.17, liveOdds:"37.04:1", for965:"37.17:1", passed:true, status:"complete" },
    "perHandRank:2:Straight":       { wins:13535,  perHandRankHandWins:1000000, actualRounds:5579682, winFrequency:1.354,  rtp:96.10, liveOdds:"70:1",    for965:"70.3:1",  passed:true, status:"complete" },
    // Hand Ranks — H3
    "perHandRank:3:Straight":       { wins:556487, perHandRankHandWins:1000000, actualRounds:17562520, winFrequency:55.649, rtp:96.83, liveOdds:"0.74:1", for965:"0.73:1",  passed:true, status:"complete" },
    "perHandRank:3:Full House":     { wins:182621, perHandRankHandWins:1000000, actualRounds:17524689, winFrequency:18.262, rtp:96.61, liveOdds:"4.29:1", for965:"4.28:1",  passed:true, status:"complete" },
    "perHandRank:3:Two Pair":       { wins:155580, perHandRankHandWins:1000000, actualRounds:17574074, winFrequency:15.558, rtp:95.99, liveOdds:"5.17:1", for965:"5.2:1",   passed:true, status:"complete" },
    "perHandRank:3:Three of a Kind":{ wins:104963, perHandRankHandWins:1000000, actualRounds:17579097, winFrequency:10.496, rtp:96.04, liveOdds:"8.15:1", for965:"8.19:1",  passed:true, status:"complete" },
    // Hand Ranks — H4
    "perHandRank:4:Flush":          { wins:547749, perHandRankHandWins:1000000, actualRounds:10443737, winFrequency:54.775, rtp:95.86, liveOdds:"0.75:1",  for965:"0.76:1",  passed:true, status:"complete" },
    "perHandRank:4:Straight":       { wins:317592, perHandRankHandWins:1000000, actualRounds:10443956, winFrequency:31.759, rtp:95.91, liveOdds:"2.02:1",  for965:"2.04:1",  passed:true, status:"complete" },
    "perHandRank:4:Full House":     { wins:98135,  perHandRankHandWins:1000000, actualRounds:10416868, winFrequency:9.814,  rtp:97.55, liveOdds:"8.94:1",  for965:"8.83:1",  passed:true, status:"complete" },
    "perHandRank:4:Two Pair":       { wins:36395,  perHandRankHandWins:1000000, actualRounds:10435020, winFrequency:3.640,  rtp:95.21, liveOdds:"25.45:1", for965:"25.51:1", passed:true, status:"complete" },
    // Hand Ranks — H5
    "perHandRank:5:Flush":          { wins:457111, perHandRankHandWins:1000000, actualRounds:8715319, winFrequency:45.711, rtp:96.45, liveOdds:"1.11:1",  for965:"1.11:1",  passed:true, status:"complete" },
    "perHandRank:5:Straight":       { wins:212000, perHandRankHandWins:1000000, actualRounds:8720771, winFrequency:21.200, rtp:96.04, liveOdds:"3.53:1",  for965:"3.55:1",  passed:true, status:"complete" },
    "perHandRank:5:Full House":     { wins:168548, perHandRankHandWins:1000000, actualRounds:8716284, winFrequency:16.855, rtp:96.75, liveOdds:"4.74:1",  for965:"4.73:1",  passed:true, status:"complete" },
    "perHandRank:5:Three of a Kind":{ wins:80838,  perHandRankHandWins:1000000, actualRounds:8716678, winFrequency:8.084,  rtp:95.47, liveOdds:"10.81:1", for965:"10.94:1", passed:true, status:"complete" },
    "perHandRank:5:Two Pair":       { wins:45576,  perHandRankHandWins:1000000, actualRounds:8705898, winFrequency:4.558,  rtp:96.85, liveOdds:"20.25:1", for965:"20.17:1", passed:true, status:"complete" },
    "perHandRank:5:Four of a Kind": { wins:17581,  perHandRankHandWins:1000000, actualRounds:8710186, winFrequency:1.758,  rtp:96.70, liveOdds:"54:1",    for965:"53.89:1", passed:true, status:"complete" },
    // Hand Ranks — H6
    "perHandRank:6:Flush":          { wins:379709, perHandRankHandWins:1000000, actualRounds:7174153, winFrequency:37.971, rtp:97.21, liveOdds:"1.56:1",  for965:"1.54:1",  passed:true, status:"complete" },
    "perHandRank:6:Straight":       { wins:214585, perHandRankHandWins:1000000, actualRounds:7174322, winFrequency:21.459, rtp:96.78, liveOdds:"3.51:1",  for965:"3.5:1",   passed:true, status:"complete" },
    "perHandRank:6:Full House":     { wins:202130, perHandRankHandWins:1000000, actualRounds:7179923, winFrequency:20.213, rtp:96.62, liveOdds:"3.78:1",  for965:"3.77:1",  passed:true, status:"complete" },
    "perHandRank:6:Three of a Kind":{ wins:110275, perHandRankHandWins:1000000, actualRounds:7177964, winFrequency:11.028, rtp:96.27, liveOdds:"7.73:1",  for965:"7.75:1",  passed:true, status:"complete" },
    "perHandRank:6:Two Pair":       { wins:63907,  perHandRankHandWins:1000000, actualRounds:7169667, winFrequency:6.391,  rtp:96.69, liveOdds:"14.13:1", for965:"14.1:1",  passed:true, status:"complete" },
    "perHandRank:6:Four of a Kind": { wins:28661,  perHandRankHandWins:1000000, actualRounds:7170689, winFrequency:2.866,  rtp:95.96, liveOdds:"32.48:1", for965:"32.67:1", passed:true, status:"complete" },
    // Hand Ranks — H7
    "perHandRank:7:Full House":     { wins:440854, perHandRankHandWins:1000000, actualRounds:8057730, winFrequency:44.085, rtp:95.67, liveOdds:"1.17:1",  for965:"1.19:1",  passed:true, status:"complete" },
    "perHandRank:7:Three of a Kind":{ wins:313820, perHandRankHandWins:1000000, actualRounds:8047198, winFrequency:31.382, rtp:97.60, liveOdds:"2.11:1",  for965:"2.08:1",  passed:true, status:"complete" },
    "perHandRank:7:Four of a Kind": { wins:159648, perHandRankHandWins:1000000, actualRounds:8050210, winFrequency:15.965, rtp:96.43, liveOdds:"5.04:1",  for965:"5.04:1",  passed:true, status:"complete" },
    "perHandRank:7:Straight":       { wins:82964,  perHandRankHandWins:1000000, actualRounds:8064473, winFrequency:8.296,  rtp:96.98, liveOdds:"10.69:1", for965:"10.63:1", passed:true, status:"complete" },
    // Hand Ranks — H8
    "perHandRank:8:Flush":          { wins:445579, perHandRankHandWins:1000000, actualRounds:8566161, winFrequency:44.558, rtp:96.69, liveOdds:"1.17:1",  for965:"1.17:1",  passed:true, status:"complete" },
    "perHandRank:8:Full House":     { wins:157169, perHandRankHandWins:1000000, actualRounds:8553858, winFrequency:15.717, rtp:96.82, liveOdds:"5.16:1",  for965:"5.14:1",  passed:true, status:"complete" },
    "perHandRank:8:Straight":       { wins:145356, perHandRankHandWins:1000000, actualRounds:8574596, winFrequency:14.536, rtp:95.50, liveOdds:"5.57:1",  for965:"5.64:1",  passed:true, status:"complete" },
    "perHandRank:8:Three of a Kind":{ wins:144610, perHandRankHandWins:1000000, actualRounds:8579488, winFrequency:14.461, rtp:96.89, liveOdds:"5.7:1",   for965:"5.67:1",  passed:true, status:"complete" },
    "perHandRank:8:Two Pair":       { wins:72249,  perHandRankHandWins:1000000, actualRounds:8580885, winFrequency:7.225,  rtp:97.03, liveOdds:"12.43:1", for965:"12.36:1", passed:true, status:"complete" },
    "perHandRank:8:Four of a Kind": { wins:34139,  perHandRankHandWins:1000000, actualRounds:8559842, winFrequency:3.414,  rtp:96.61, liveOdds:"27.3:1",  for965:"27.27:1", passed:true, status:"complete" },
    // Hand Ranks — H9
    "perHandRank:9:Full House":     { wins:423400, perHandRankHandWins:1000000, actualRounds:10486112, winFrequency:42.340, rtp:96.54, liveOdds:"1.28:1",  for965:"1.28:1",  passed:true, status:"complete" },
    "perHandRank:9:Three of a Kind":{ wins:302566, perHandRankHandWins:1000000, actualRounds:10511437, winFrequency:30.257, rtp:97.12, liveOdds:"2.21:1",  for965:"2.19:1",  passed:true, status:"complete" },
    "perHandRank:9:Four of a Kind": { wins:208655, perHandRankHandWins:1000000, actualRounds:10501728, winFrequency:20.866, rtp:96.61, liveOdds:"3.63:1",  for965:"3.62:1",  passed:true, status:"complete" },
    "perHandRank:9:Straight":       { wins:61358,  perHandRankHandWins:1000000, actualRounds:10503970, winFrequency:6.136,  rtp:95.72, liveOdds:"14.6:1",  for965:"14.73:1", passed:true, status:"complete" },
    // Hand Ranks — H10
    "perHandRank:10:Full House":     { wins:276245, perHandRankHandWins:1000000, actualRounds:17555954, winFrequency:27.625, rtp:95.58, liveOdds:"2.46:1", for965:"2.49:1",  passed:true, status:"complete" },
    "perHandRank:10:Straight":       { wins:250191, perHandRankHandWins:1000000, actualRounds:17537910, winFrequency:25.019, rtp:96.07, liveOdds:"2.84:1", for965:"2.86:1",  passed:true, status:"complete" },
    "perHandRank:10:Three of a Kind":{ wins:165998, perHandRankHandWins:1000000, actualRounds:17551506, winFrequency:16.600, rtp:96.11, liveOdds:"4.79:1", for965:"4.81:1",  passed:true, status:"complete" },
    "perHandRank:10:Two Pair":       { wins:162349, perHandRankHandWins:1000000, actualRounds:17509805, winFrequency:16.235, rtp:96.92, liveOdds:"4.97:1", for965:"4.94:1",  passed:true, status:"complete" },
    "perHandRank:10:Flush":          { wins:109355, perHandRankHandWins:1000000, actualRounds:17517147, winFrequency:10.936, rtp:95.25, liveOdds:"7.71:1", for965:"7.82:1",  passed:true, status:"complete" },
    "perHandRank:10:Four of a Kind": { wins:35170,  perHandRankHandWins:1000000, actualRounds:17516101, winFrequency:3.517,  rtp:96.37, liveOdds:"26.4:1", for965:"26.44:1", passed:true, status:"complete" },
    // Color Board — real PDF data
    "color:3R": { wins:500353, perHandRankHandWins:null, actualRounds:1000000, winFrequency:50.035, rtp:95.57, liveOdds:"0.91:1", for965:"0.93:1", passed:true, status:"complete" },
    "color:3B": { wins:500242, perHandRankHandWins:null, actualRounds:1000000, winFrequency:50.024, rtp:95.55, liveOdds:"0.91:1", for965:"0.93:1", passed:true, status:"complete" },
    "color:4R": { wins:166229, perHandRankHandWins:null, actualRounds:1000000, winFrequency:16.623, rtp:95.58, liveOdds:"4.75:1", for965:"4.81:1", passed:true, status:"complete" },
    "color:4B": { wins:166050, perHandRankHandWins:null, actualRounds:1000000, winFrequency:16.605, rtp:95.48, liveOdds:"4.75:1", for965:"4.81:1", passed:true, status:"complete" },
    "color:5R": { wins:21756,  perHandRankHandWins:null, actualRounds:1000000, winFrequency:2.176,  rtp:95.73, liveOdds:"43:1",   for965:"43.36:1", passed:true, status:"complete" },
    "color:5B": { wins:21774,  perHandRankHandWins:null, actualRounds:1000000, winFrequency:2.177,  rtp:95.81, liveOdds:"43:1",   for965:"43.32:1", passed:true, status:"complete" },
    // River Board — removed bogus placeholder data; re-run required for accurate adaptive results
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FULL CERTIFICATION  (2,000,000 rounds/bet · eCOGRA / Full Cert · 95%–98%)
  // ─────────────────────────────────────────────────────────────────────────
  full: {
    // Carded Hands
    "hand:1":  { wins:90142,  perHandRankHandWins:null, actualRounds:2000000, winFrequency:4.507,  rtp:96.00, liveOdds:"20.3:1", for965:"20.41:1", passed:true, status:"complete" },
    "hand:2":  { wins:358490, perHandRankHandWins:null, actualRounds:2000000, winFrequency:17.925, rtp:95.90, liveOdds:"4.35:1", for965:"4.38:1",  passed:true, status:"complete" },
    "hand:3":  { wins:114116, perHandRankHandWins:null, actualRounds:2000000, winFrequency:5.706,  rtp:95.86, liveOdds:"15.8:1", for965:"15.91:1", passed:true, status:"complete" },
    "hand:4":  { wins:191625, perHandRankHandWins:null, actualRounds:2000000, winFrequency:9.581,  rtp:95.81, liveOdds:"9:1",    for965:"9.07:1",  passed:true, status:"complete" },
    "hand:5":  { wins:229847, perHandRankHandWins:null, actualRounds:2000000, winFrequency:11.492, rtp:96.54, liveOdds:"7.4:1",  for965:"7.4:1",   passed:true, status:"complete" },
    "hand:6":  { wins:279753, perHandRankHandWins:null, actualRounds:2000000, winFrequency:13.988, rtp:96.51, liveOdds:"5.9:1",  for965:"5.9:1",   passed:true, status:"complete" },
    "hand:7":  { wins:248502, perHandRankHandWins:null, actualRounds:2000000, winFrequency:12.425, rtp:96.92, liveOdds:"6.8:1",  for965:"6.77:1",  passed:true, status:"complete" },
    "hand:8":  { wins:233457, perHandRankHandWins:null, actualRounds:2000000, winFrequency:11.673, rtp:96.88, liveOdds:"7.3:1",  for965:"7.27:1",  passed:true, status:"complete" },
    "hand:9":  { wins:190878, perHandRankHandWins:null, actualRounds:2000000, winFrequency:9.544,  rtp:96.39, liveOdds:"9.1:1",  for965:"9.11:1",  passed:true, status:"complete" },
    "hand:10": { wins:114233, perHandRankHandWins:null, actualRounds:2000000, winFrequency:5.712,  rtp:95.96, liveOdds:"15.8:1", for965:"15.9:1",  passed:true, status:"complete" },
    // Hand Ranks — H1
    "perHandRank:1:Full House":     { wins:501709, perHandRankHandWins:2000000, actualRounds:44410951, winFrequency:25.085, rtp:96.83, liveOdds:"2.86:1",  for965:"2.85:1",  passed:true, status:"complete" },
    "perHandRank:1:Two Pair":       { wins:452548, perHandRankHandWins:2000000, actualRounds:44408259, winFrequency:22.627, rtp:97.30, liveOdds:"3.3:1",   for965:"3.26:1",  passed:true, status:"complete" },
    "perHandRank:1:Straight":       { wins:300099, perHandRankHandWins:2000000, actualRounds:30000000, winFrequency:22.216, rtp:95.75, liveOdds:"3.31:1",  for965:"3.34:1",  passed:true, status:"complete" },
    "perHandRank:1:Flush":          { wins:199442, perHandRankHandWins:2000000, actualRounds:30000000, winFrequency:14.770, rtp:96.75, liveOdds:"5.55:1",  for965:"5.53:1",  passed:true, status:"complete" },
    "perHandRank:1:Three of a Kind":{ wins:143084, perHandRankHandWins:2000000, actualRounds:30000000, winFrequency:10.584, rtp:96.95, liveOdds:"8.16:1",  for965:"8.12:1",  passed:true, status:"complete" },
    "perHandRank:1:One Pair":       { wins:44247,  perHandRankHandWins:2000000, actualRounds:30000000, winFrequency:3.279,  rtp:95.76, liveOdds:"28.2:1",  for965:"28.43:1", passed:true, status:"complete" },
    // Hand Ranks — H2
    "perHandRank:2:Full House":     { wins:821871, perHandRankHandWins:2000000, actualRounds:11137478, winFrequency:41.094, rtp:96.16, liveOdds:"1.34:1",  for965:"1.35:1",  passed:true, status:"complete" },
    "perHandRank:2:Three of a Kind":{ wins:734677, perHandRankHandWins:2000000, actualRounds:11153136, winFrequency:36.734, rtp:96.61, liveOdds:"1.63:1",  for965:"1.63:1",  passed:true, status:"complete" },
    "perHandRank:2:Four of a Kind": { wins:225280, perHandRankHandWins:2000000, actualRounds:11142824, winFrequency:11.264, rtp:97.21, liveOdds:"7.63:1",  for965:"7.57:1",  passed:true, status:"complete" },
    "perHandRank:2:Flush":          { wins:140191, perHandRankHandWins:2000000, actualRounds:11143077, winFrequency:7.010,  rtp:95.82, liveOdds:"12.67:1", for965:"12.77:1", passed:true, status:"complete" },
    "perHandRank:2:One Pair":       { wins:51145,  perHandRankHandWins:2000000, actualRounds:11155161, winFrequency:2.557,  rtp:97.28, liveOdds:"37.04:1", for965:"36.74:1", passed:true, status:"complete" },
    "perHandRank:2:Straight":       { wins:27042,  perHandRankHandWins:2000000, actualRounds:11156183, winFrequency:1.352,  rtp:96.00, liveOdds:"70:1",    for965:"70.37:1", passed:true, status:"complete" },
    // Hand Ranks — H3
    "perHandRank:3:Straight":       { wins:1113509, perHandRankHandWins:2000000, actualRounds:35055917, winFrequency:55.676, rtp:96.88, liveOdds:"0.74:1", for965:"0.73:1",  passed:true, status:"complete" },
    "perHandRank:3:Full House":     { wins:366936,  perHandRankHandWins:2000000, actualRounds:35104033, winFrequency:18.347, rtp:97.05, liveOdds:"4.29:1", for965:"4.26:1",  passed:true, status:"complete" },
    "perHandRank:3:Two Pair":       { wins:310548,  perHandRankHandWins:2000000, actualRounds:35119140, winFrequency:15.527, rtp:95.80, liveOdds:"5.17:1", for965:"5.21:1",  passed:true, status:"complete" },
    "perHandRank:3:Three of a Kind":{ wins:208952,  perHandRankHandWins:2000000, actualRounds:35147248, winFrequency:10.448, rtp:95.60, liveOdds:"8.15:1", for965:"8.24:1",  passed:true, status:"complete" },
    // Hand Ranks — H4
    "perHandRank:4:Flush":          { wins:1095661, perHandRankHandWins:2000000, actualRounds:20864551, winFrequency:54.783, rtp:95.87, liveOdds:"0.75:1",  for965:"0.76:1",  passed:true, status:"complete" },
    "perHandRank:4:Straight":       { wins:635119,  perHandRankHandWins:2000000, actualRounds:20862056, winFrequency:31.756, rtp:95.90, liveOdds:"2.02:1",  for965:"2.04:1",  passed:true, status:"complete" },
    "perHandRank:4:Full House":     { wins:196093,  perHandRankHandWins:2000000, actualRounds:20885929, winFrequency:9.805,  rtp:97.46, liveOdds:"8.94:1",  for965:"8.84:1",  passed:true, status:"complete" },
    "perHandRank:4:Two Pair":       { wins:72512,   perHandRankHandWins:2000000, actualRounds:20843621, winFrequency:3.626,  rtp:95.90, liveOdds:"25.45:1", for965:"25.62:1", passed:true, status:"complete" },
    // Hand Ranks — H5
    "perHandRank:5:Flush":          { wins:913995, perHandRankHandWins:2000000, actualRounds:17433476, winFrequency:45.700, rtp:96.43, liveOdds:"1.11:1",  for965:"1.11:1",  passed:true, status:"complete" },
    "perHandRank:5:Straight":       { wins:423664, perHandRankHandWins:2000000, actualRounds:17418067, winFrequency:21.183, rtp:95.96, liveOdds:"3.53:1",  for965:"3.56:1",  passed:true, status:"complete" },
    "perHandRank:5:Full House":     { wins:336620, perHandRankHandWins:2000000, actualRounds:17431612, winFrequency:16.831, rtp:96.61, liveOdds:"4.74:1",  for965:"4.73:1",  passed:true, status:"complete" },
    "perHandRank:5:Three of a Kind":{ wins:161336, perHandRankHandWins:2000000, actualRounds:17429245, winFrequency:8.067,  rtp:95.27, liveOdds:"10.81:1", for965:"10.96:1", passed:true, status:"complete" },
    "perHandRank:5:Two Pair":       { wins:91860,  perHandRankHandWins:2000000, actualRounds:17430980, winFrequency:4.593,  rtp:97.60, liveOdds:"20.25:1", for965:"20.01:1", passed:true, status:"complete" },
    "perHandRank:5:Four of a Kind": { wins:34929,  perHandRankHandWins:2000000, actualRounds:17398077, winFrequency:1.746,  rtp:96.05, liveOdds:"54:1",    for965:"54.25:1", passed:true, status:"complete" },
    // Hand Ranks — H6
    "perHandRank:6:Flush":          { wins:757682, perHandRankHandWins:2000000, actualRounds:14346730, winFrequency:37.884, rtp:96.98, liveOdds:"1.56:1",  for965:"1.55:1",  passed:true, status:"complete" },
    "perHandRank:6:Straight":       { wins:427184, perHandRankHandWins:2000000, actualRounds:14343601, winFrequency:21.359, rtp:96.33, liveOdds:"3.51:1",  for965:"3.52:1",  passed:true, status:"complete" },
    "perHandRank:6:Full House":     { wins:405307, perHandRankHandWins:2000000, actualRounds:14343661, winFrequency:20.265, rtp:96.87, liveOdds:"3.78:1",  for965:"3.76:1",  passed:true, status:"complete" },
    "perHandRank:6:Three of a Kind":{ wins:220996, perHandRankHandWins:2000000, actualRounds:14326389, winFrequency:11.050, rtp:96.46, liveOdds:"7.73:1",  for965:"7.73:1",  passed:true, status:"complete" },
    "perHandRank:6:Two Pair":       { wins:127836, perHandRankHandWins:2000000, actualRounds:14337014, winFrequency:6.392,  rtp:96.71, liveOdds:"14.13:1", for965:"14.1:1",  passed:true, status:"complete" },
    "perHandRank:6:Four of a Kind": { wins:57349,  perHandRankHandWins:2000000, actualRounds:14344483, winFrequency:2.867,  rtp:96.00, liveOdds:"32.48:1", for965:"32.65:1", passed:true, status:"complete" },
    // Hand Ranks — H7
    "perHandRank:7:Full House":     { wins:883224, perHandRankHandWins:2000000, actualRounds:16095990, winFrequency:44.161, rtp:95.83, liveOdds:"1.17:1",  for965:"1.19:1",  passed:true, status:"complete" },
    "perHandRank:7:Three of a Kind":{ wins:627148, perHandRankHandWins:2000000, actualRounds:16101037, winFrequency:31.357, rtp:97.52, liveOdds:"2.11:1",  for965:"2.08:1",  passed:true, status:"complete" },
    "perHandRank:7:Four of a Kind": { wins:319559, perHandRankHandWins:2000000, actualRounds:16102368, winFrequency:15.978, rtp:96.51, liveOdds:"5.04:1",  for965:"5.04:1",  passed:true, status:"complete" },
    "perHandRank:7:Straight":       { wins:165503, perHandRankHandWins:2000000, actualRounds:16113068, winFrequency:8.275,  rtp:96.74, liveOdds:"10.69:1", for965:"10.66:1", passed:true, status:"complete" },
    // Hand Ranks — H8
    "perHandRank:8:Flush":          { wins:892008, perHandRankHandWins:2000000, actualRounds:17145504, winFrequency:44.600, rtp:96.78, liveOdds:"1.17:1",  for965:"1.16:1",  passed:true, status:"complete" },
    "perHandRank:8:Full House":     { wins:314360, perHandRankHandWins:2000000, actualRounds:17146838, winFrequency:15.718, rtp:96.82, liveOdds:"5.16:1",  for965:"5.14:1",  passed:true, status:"complete" },
    "perHandRank:8:Straight":       { wins:291099, perHandRankHandWins:2000000, actualRounds:17139634, winFrequency:14.555, rtp:95.63, liveOdds:"5.57:1",  for965:"5.63:1",  passed:true, status:"complete" },
    "perHandRank:8:Three of a Kind":{ wins:287815, perHandRankHandWins:2000000, actualRounds:17150329, winFrequency:14.391, rtp:96.42, liveOdds:"5.7:1",   for965:"5.71:1",  passed:true, status:"complete" },
    "perHandRank:8:Two Pair":       { wins:144592, perHandRankHandWins:2000000, actualRounds:17146325, winFrequency:7.230,  rtp:97.09, liveOdds:"12.43:1", for965:"12.35:1", passed:true, status:"complete" },
    "perHandRank:8:Four of a Kind": { wins:68807,  perHandRankHandWins:2000000, actualRounds:17128889, winFrequency:3.440,  rtp:97.36, liveOdds:"27.3:1",  for965:"27.05:1", passed:true, status:"complete" },
    // Hand Ranks — H9
    "perHandRank:9:Full House":     { wins:848701, perHandRankHandWins:2000000, actualRounds:21012715, winFrequency:42.435, rtp:96.75, liveOdds:"1.28:1",  for965:"1.27:1",  passed:true, status:"complete" },
    "perHandRank:9:Three of a Kind":{ wins:606342, perHandRankHandWins:2000000, actualRounds:21000416, winFrequency:30.317, rtp:97.32, liveOdds:"2.21:1",  for965:"2.18:1",  passed:true, status:"complete" },
    "perHandRank:9:Four of a Kind": { wins:416206, perHandRankHandWins:2000000, actualRounds:21016151, winFrequency:20.810, rtp:96.35, liveOdds:"3.63:1",  for965:"3.64:1",  passed:true, status:"complete" },
    "perHandRank:9:Straight":       { wins:123055, perHandRankHandWins:2000000, actualRounds:21001176, winFrequency:6.153,  rtp:95.98, liveOdds:"14.6:1",  for965:"14.68:1", passed:true, status:"complete" },
    // Hand Ranks — H10
    "perHandRank:10:Full House":     { wins:553148, perHandRankHandWins:2000000, actualRounds:35090437, winFrequency:27.657, rtp:95.69, liveOdds:"2.46:1", for965:"2.49:1",  passed:true, status:"complete" },
    "perHandRank:10:Straight":       { wins:500802, perHandRankHandWins:2000000, actualRounds:35072158, winFrequency:25.040, rtp:96.15, liveOdds:"2.84:1", for965:"2.85:1",  passed:true, status:"complete" },
    "perHandRank:10:Three of a Kind":{ wins:332437, perHandRankHandWins:2000000, actualRounds:35053028, winFrequency:16.622, rtp:96.24, liveOdds:"4.79:1", for965:"4.81:1",  passed:true, status:"complete" },
    "perHandRank:10:Two Pair":       { wins:326796, perHandRankHandWins:2000000, actualRounds:35053052, winFrequency:16.340, rtp:97.55, liveOdds:"4.97:1", for965:"4.91:1",  passed:true, status:"complete" },
    "perHandRank:10:Flush":          { wins:218485, perHandRankHandWins:2000000, actualRounds:35046102, winFrequency:10.924, rtp:95.15, liveOdds:"7.71:1", for965:"7.83:1",  passed:true, status:"complete" },
    "perHandRank:10:Four of a Kind": { wins:70000,  perHandRankHandWins:2000000, actualRounds:35078197, winFrequency:3.500,  rtp:95.90, liveOdds:"26.4:1", for965:"26.57:1", passed:true, status:"complete" },
    // Color Board — real PDF data
    "color:3R": { wins:998648,  perHandRankHandWins:null, actualRounds:2000000, winFrequency:49.932, rtp:95.37, liveOdds:"0.91:1", for965:"0.93:1", passed:true, status:"complete" },
    "color:3B": { wins:999818,  perHandRankHandWins:null, actualRounds:2000000, winFrequency:49.991, rtp:95.48, liveOdds:"0.91:1", for965:"0.93:1", passed:true, status:"complete" },
    "color:4R": { wins:332935,  perHandRankHandWins:null, actualRounds:2000000, winFrequency:16.647, rtp:95.72, liveOdds:"4.75:1", for965:"4.8:1",  passed:true, status:"complete" },
    "color:4B": { wins:333371,  perHandRankHandWins:null, actualRounds:2000000, winFrequency:16.669, rtp:95.84, liveOdds:"4.75:1", for965:"4.79:1", passed:true, status:"complete" },
    "color:5R": { wins:43521,   perHandRankHandWins:null, actualRounds:2000000, winFrequency:2.176,  rtp:95.75, liveOdds:"43:1",   for965:"43.35:1", passed:true, status:"complete" },
    "color:5B": { wins:43585,   perHandRankHandWins:null, actualRounds:2000000, winFrequency:2.179,  rtp:95.89, liveOdds:"43:1",   for965:"43.28:1", passed:true, status:"complete" },
    // River Board — removed bogus placeholder data; re-run required for accurate adaptive results
  },
};