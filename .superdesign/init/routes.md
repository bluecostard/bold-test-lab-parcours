# Routes (V2 state machine)

Entry: `app/src/main.jsx` renders `AppV2` by default (`?v1=1` for the old UI).

Screens in `app/src/v2/AppV2.jsx`:

| screen | file | layout |
|---|---|---|
| discover | screens.jsx DiscoverScreen | Header + tester BottomNav |
| campaign | screens.jsx CampaignScreen | Back, no nav |
| review | screens.jsx ReviewFormScreen | Back, no nav |
| review-summary | screens.jsx ReviewSummaryScreen | Back, no nav |
| review-published | screens.jsx PublishedReviewScreen | Back, no nav |
| optional-question | screens.jsx OptionalQuestionScreen | Back, no nav |
| community | screens.jsx CommunityScreen | tester BottomNav |
| ranking | screens.jsx RankingScreen | tester BottomNav |
| profile | screens.jsx ProfileScreen | Header + gear + tester BottomNav |
| login | screens.jsx LoginScreen | Back, no nav, no title |
| settings | PlaceholderScreen today — NEW TARGET | Back, no bottom nav |
| entrepreneur | entrepreneur.jsx EntrepreneurFormScreen | Back, no nav |
| offer | entrepreneur.jsx OfferScreen | Back, no nav |
| payment | entrepreneur.jsx PaymentScreen | Back, no nav |
| confirmation | entrepreneur.jsx ConfirmationScreen | Header, no nav |
| results | entrepreneur.jsx ResultsScreen | entrepreneur-style list |
| report | entrepreneur.jsx ReportScreen | Header, no nav |

Settings pages (to design): menu, CGV, CGU, Traitement des données, Contact. Clerk sign-in/out stays in the profile gear, not in Settings.
