import { StrictMode } from 'react';
import { Toaster } from 'sonner';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import SignUp from './components/auth/SignUp.jsx';
import SignIn from './components/auth/SignIn.jsx';
import OTPVerification from './components/auth/OTPVerification.jsx';
import ForgotPassword from './components/auth/ForgotPassword.jsx';
import Welcome from './components/onboarding/Welcome.jsx';
import ExamSelection from './components/onboarding/ExamSelection.jsx';
import SubjectSelection from './components/onboarding/SubjectSelection.jsx';
import SchoolName from './components/onboarding/SchoolName.jsx';
import StudyHabits from './components/onboarding/StudyHabits.jsx';
import DiagnosticIntro from './components/onboarding/DiagnosticIntro.jsx';
import DiagnosticQuestion from './components/onboarding/DiagnosticQuestion.jsx';
import AnalyzingResults from './components/onboarding/AnalyzingResults.jsx';
import ResultsReveal from './components/onboarding/ResultsReveal.jsx';
import PracticeHub from './components/practice/PracticeHub.jsx';
// import PracticeSetup from './components/practice/PracticeSetup.jsx';
// import ExamSetup from './components/practice/ExamSetup.jsx';
import PracticeSession from './components/practice/PracticeSession.jsx';
import ExamSession from './components/practice/ExamSession.jsx';
import PracticeResults from './components/practice/PracticeResults.jsx';
import JAMBFullExamScreen from './components/practice/JAMBFullExamScreen.jsx';
import JAMBFullExamResults from './components/practice/JAMBFullExamResults.jsx';
import ExamTypeSelect from './components/practice/ExamTypeSelect.jsx';
import PracticeTypeSelect from './components/practice/PracticeTypeSelect.jsx';
import SubjectYearSelect from './components/practice/SubjectYearSelect.jsx';
import TopicDifficultySelect from './components/practice/TopicDifficultySelect.jsx';
import TimerSettings from './components/practice/TimerSettings.jsx';
import GeneratingQuestions from './components/practice/GeneratingQuestions.jsx';
import ReviewWrongAnswers from './components/practice/ReviewWrongAnswers.jsx';
import MockGenerator from './components/practice/MockGenerator.jsx';
import MockHistory from './components/practice/MockHistory.jsx';
import MockHistoryDetail from './components/practice/MockHistoryDetail.jsx';
import StrategyHome from './components/practice/StrategyHome.jsx';
import JAMBStrategy from './components/practice/JAMBStrategy.jsx';
import WAECStrategy from './components/practice/WAECStrategy.jsx';
import NECOStrategy from './components/practice/NECOStrategy.jsx';
import JUPEBStrategy from './components/practice/JUPEBStrategy.jsx';
import DocumentsHome from './components/practice/DocumentsHome.jsx';
import DocumentView from './components/practice/DocumentView.jsx';
import DiagramLibrary from './components/practice/DiagramLibrary.jsx';
import DiagramView from './components/practice/DiagramView.jsx';
import QuickReferenceHome from './components/practice/QuickReferenceHome.jsx';
import PeriodicTable from './components/practice/PeriodicTable.jsx';
import FormulaSheet from './components/practice/FormulaSheet.jsx';
import UnitConverter from './components/practice/UnitConverter.jsx';
import LabEquipment from './components/practice/LabEquipment.jsx';
import LiteraryTerms from './components/practice/LiteraryTerms.jsx';
import Bookmarks from './components/practice/Bookmarks.jsx';
import PracticeHistory from './components/practice/PracticeHistory.jsx';
import PracticeHistoryDetail from './components/practice/PracticeHistoryDetail.jsx';

// Flashcards
import FlashcardHome from './components/flashcards/FlashcardHome.jsx';
import FlashcardStudy from './components/flashcards/FlashcardStudy.jsx';

// Literature
import LiteratureHome from './components/literature/LiteratureHome.jsx';
import LiteratureDetail from './components/literature/LiteratureDetail.jsx';
import Home from './components/dashboard/Home.jsx';
import StreakDetail from './components/dashboard/StreakDetail.jsx';
import ScorePrediction from './components/dashboard/ScorePrediction.jsx';
import WeakAreas from './components/dashboard/WeakAreas.jsx';
import AITutor from './components/ai/AITutor.jsx';
import ActiveChat from './components/ai/ActiveChat.jsx';
import AuthLayout from './components/auth/AuthLayout.jsx';
import OnboardingGuard from './components/auth/OnboardingGuard.jsx';
import { OnboardingProvider } from './store/OnboardingContext.jsx';
import CameraSolver from './components/ai/CameraSolver.jsx';
import CameraSolution from './components/ai/CameraSolution.jsx';
import WriteMode from './components/ai/WriteMode.jsx';
import VoiceSetup from './components/ai/VoiceSetup.jsx';
import VoiceSession from './components/ai/VoiceSession.jsx';
import ConceptsLibrary from './components/ai/ConceptsLibrary.jsx';
import ConceptView from './components/ai/ConceptView.jsx';
import ConversationHistory from './components/ai/ConversationHistory.jsx';
import Profile from './components/profile/Profile.jsx';
import EditProfile from './components/profile/EditProfile.jsx';
import ProfileAnalytics from './components/profile/ProfileAnalytics.jsx';
import ErrorPatterns from './components/profile/ErrorPatterns.jsx';
import Badges from './components/profile/Badges.jsx';
import Subscription from './components/profile/Subscription.jsx';
import SubscriptionVerify from './components/profile/SubscriptionVerify.jsx';
import Referrals from './components/profile/Referrals.jsx';
import SettingsMain from './components/settings/SettingsMain.jsx';
import EditProfileSettings from './components/profile/EditProfile.jsx';
import ChangePassword from './components/settings/ChangePassword.jsx';
import ChangeEmail from './components/settings/ChangeEmail.jsx';
import ChangePhone from './components/settings/ChangePhone.jsx';
import NotificationPreferences from './components/settings/NotificationPreferences.jsx';
import DoNotDisturb from './components/settings/DoNotDisturb.jsx';
import StudyReminder from './components/settings/StudyReminder.jsx';
import ExplanationLevel from './components/settings/ExplanationLevel.jsx';
import DailyTarget from './components/settings/DailyTarget.jsx';
import LanguageSettings from './components/settings/LanguageSettings.jsx';
import TeachingStyle from './components/settings/TeachingStyle.jsx';
import DataUsage from './components/settings/DataUsage.jsx';
import OfflineContent from './components/settings/OfflineContent.jsx';
import ProfileVisibility from './components/settings/ProfileVisibility.jsx';
import DataSharing from './components/settings/DataSharing.jsx';
import DownloadData from './components/settings/DownloadData.jsx';
import HelpCenter from './components/settings/HelpCenter.jsx';
import ContactSupport from './components/settings/ContactSupport.jsx';
import ReportBug from './components/settings/ReportBug.jsx';
import TermsOfService from './components/settings/TermsOfService.jsx';
import PrivacyPolicy from './components/settings/PrivacyPolicy.jsx';
import DeleteAccount from './components/settings/DeleteAccount.jsx';
import NotificationsCenter from './components/global/NotificationsCenter.jsx';
import GlobalSearch from './components/global/GlobalSearch.jsx';
import AchievementPopup from './components/global/AchievementPopup.jsx';
import PointsEarnedPopup from './components/global/PointsEarnedPopup.jsx';
import CommunityHome from './components/community/CommunityHome.jsx';
import Leaderboard from './components/community/Leaderboard.jsx';
import QAFeed from './components/community/QAFeed.jsx';
import AskQuestion from './components/community/AskQuestion.jsx';
import QADetail from './components/community/QADetail.jsx';
import StudyBuddies from './components/community/StudyBuddies.jsx';
import BuddyProfile from './components/community/BuddyProfile.jsx';
import BuddyChat from './components/community/BuddyChat.jsx';
import StudyRooms from './components/community/StudyRooms.jsx';
import ActiveStudyRoom from './components/community/ActiveStudyRoom.jsx';
import CreateStudyRoom from './components/community/CreateStudyRoom.jsx';
import Challenges from './components/community/Challenges.jsx';
import ChallengeLobby from './components/community/ChallengeLobby.jsx';
import ChallengeLive from './components/community/ChallengeLive.jsx';
import TutorDirectory from './components/community/TutorDirectory.jsx';
import TutorProfile from './components/community/TutorProfile.jsx';
import SavedTutors from './components/community/SavedTutors.jsx';
import './index.css';

import SendChallenge from './pages/community/challenges/SendChallenge.jsx';
import ActiveChallenge from './pages/community/challenges/ActiveChallenge.jsx';
import ChallengeResults from './pages/community/challenges/ChallengeResults.jsx';
import StudentPublicProfile from './pages/community/StudentPublicProfile.jsx';
import FindBuddy from './pages/community/buddies/FindBuddy.jsx';
import StudyBuddySpace from './pages/community/buddies/StudyBuddySpace.jsx';
import MockResultDetail from './pages/practice/mock/MockResultDetail.jsx';
import AdminGuard from './components/admin/AdminGuard.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import AdminUsers from './components/admin/AdminUsers.jsx';
import AdminUserDetail from './components/admin/AdminUserDetail.jsx';
import AdminQuestions from './components/admin/AdminQuestions.jsx';
import AdminReports from './components/admin/AdminReports.jsx';
import AdminAICorrections from './components/admin/AdminAICorrections.jsx';
import AdminAnalytics from './components/admin/AdminAnalytics.jsx';
import AdminSystemHealth from './components/admin/AdminSystemHealth.jsx';
import AdminAudit from './components/admin/AdminAudit.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <PointsEarnedPopup />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={
          <OnboardingGuard>
            <Home />
          </OnboardingGuard>
        } />
        <Route path="/streak" element={<StreakDetail />} />
        <Route path="/prediction" element={<ScorePrediction />} />
        <Route path="/weak-areas" element={<WeakAreas />} />

        {/* AI Tutor */}
        <Route path="/ai-tutor" element={<AITutor />} />
        <Route path="/ai-tutor/chat/new" element={<ActiveChat />} />
        <Route path="/ai-tutor/chat" element={<ActiveChat />} />
        <Route path="/ai-tutor/chat/:conversationId" element={<ActiveChat />} />
        <Route path="/ai-tutor/camera" element={<CameraSolver />} />
        <Route path="/ai-tutor/camera/solution" element={<CameraSolution />} />
        <Route path="/ai-tutor/handwriting" element={<WriteMode />} />
        <Route path="/ai-tutor/voice/setup" element={<VoiceSetup />} />
        <Route path="/ai-tutor/voice/session" element={<VoiceSession />} />
        <Route path="/ai-tutor/concepts" element={<ConceptsLibrary />} />
        <Route path="/ai-tutor/concepts/:conceptId" element={<ConceptView />} />
        <Route path="/ai-tutor/concept/:id" element={<ConceptView />} />
        <Route path="/ai-tutor/history" element={<ConversationHistory />} />

        {/* Community */}
        <Route path="/community" element={<CommunityHome />} />
        <Route path="/community/leaderboard" element={<Leaderboard />} />
        <Route path="/community/qa" element={<QAFeed />} />
        <Route path="/community/qa/ask" element={<AskQuestion />} />
        <Route path="/community/qa/:id" element={<QADetail />} />
        <Route path="/community/buddies" element={<StudyBuddies />} />
        <Route path="/community/buddies/find" element={<FindBuddy />} />
        <Route path="/community/buddies/:id" element={<StudyBuddySpace />} />
        <Route path="/community/buddies/profile" element={<BuddyProfile />} />
        <Route path="/community/buddies/chat" element={<BuddyChat />} />
        <Route path="/community/rooms" element={<StudyRooms />} />
        <Route path="/community/rooms/create" element={<CreateStudyRoom />} />
        <Route path="/community/rooms/:id" element={<ActiveStudyRoom />} />
        <Route path="/community/challenges" element={<Challenges />} />
        <Route path="/community/challenges/send" element={<SendChallenge />} />
        <Route path="/community/challenges/:id" element={<ActiveChallenge />} />
        <Route path="/community/challenges/:id/results" element={<ChallengeResults />} />
        <Route path="/community/challenges/lobby" element={<ChallengeLobby />} />
        <Route path="/community/challenges/live" element={<ChallengeLive />} />
        <Route path="/community/tutors" element={<TutorDirectory />} />
        <Route path="/community/tutors/saved" element={<SavedTutors />} />
        <Route path="/community/tutor/:id" element={<TutorProfile />} />
        <Route path="/community/students/:id" element={<StudentPublicProfile />} />

        {/* Practice */}
        <Route path="/practice" element={<PracticeHub />} />
        {/* <Route path="/practice/setup" element={<PracticeSetup />} /> */}
        {/* <Route path="/practice/exam-setup" element={<ExamSetup />} /> */}
        <Route path="/practice/setup/exam-type" element={<ExamTypeSelect />} />
        <Route path="/practice/setup/type" element={<PracticeTypeSelect />} />
        <Route path="/practice/setup/subject-year" element={<SubjectYearSelect />} />
        <Route path="/practice/setup/topic" element={<TopicDifficultySelect />} />
        <Route path="/practice/setup/timer" element={<TimerSettings />} />
        <Route path="/practice/generating" element={<GeneratingQuestions />} />
        <Route path="/practice/session" element={<PracticeSession />} />
        <Route path="/practice/session/:id" element={<PracticeSession />} />
        <Route path="/practice/exam" element={<ExamSession />} />
        <Route path="/practice/exam-session/:id" element={<ExamSession />} />
        <Route path="/practice/jamb-full" element={<JAMBFullExamScreen />} />
        <Route path="/practice/jamb-full/results/:id" element={<JAMBFullExamResults />} />
        <Route path="/practice/results" element={<PracticeResults />} />
        <Route path="/practice/results/:id" element={<PracticeResults />} />
        <Route path="/practice/review" element={<ReviewWrongAnswers />} />
        <Route path="/practice/mock" element={<MockGenerator />} />
        <Route path="/practice/mock/history" element={<MockHistory />} />
        <Route path="/practice/mock/history/:id" element={<MockHistoryDetail />} />
        <Route path="/practice/strategy" element={<StrategyHome />} />
        <Route path="/practice/strategy/jamb" element={<JAMBStrategy />} />
        <Route path="/practice/strategy/waec" element={<WAECStrategy />} />
        <Route path="/practice/strategy/neco" element={<NECOStrategy />} />
        <Route path="/practice/strategy/jupeb" element={<JUPEBStrategy />} />
        <Route path="/practice/documents" element={<DocumentsHome />} />
        <Route path="/practice/documents/:id" element={<DocumentView />} />
        <Route path="/practice/document/:id" element={<DocumentView />} />
        <Route path="/practice/diagrams" element={<DiagramLibrary />} />
        <Route path="/practice/diagrams/:id" element={<DiagramView />} />
        <Route path="/practice/reference" element={<QuickReferenceHome />} />
        <Route path="/practice/reference/periodic" element={<PeriodicTable />} />
        <Route path="/practice/reference/formulas" element={<FormulaSheet />} />
        <Route path="/practice/reference/converter" element={<UnitConverter />} />
        <Route path="/practice/reference/lab" element={<LabEquipment />} />
        <Route path="/practice/reference/literary" element={<LiteraryTerms />} />
        <Route path="/practice/bookmarks" element={<Bookmarks />} />
        <Route path="/practice/history" element={<PracticeHistory />} />
        <Route path="/practice/history/:id" element={<PracticeHistoryDetail />} />

        {/* Flashcards */}
        <Route path="/flashcards" element={<FlashcardHome />} />
        <Route path="/flashcards/study" element={<FlashcardStudy />} />
        <Route path="/flashcards/deck/:id" element={<FlashcardHome />} />

        {/* Literature */}
        <Route path="/literature" element={<LiteratureHome />} />
        <Route path="/literature/:id" element={<LiteratureDetail />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/analytics" element={<ProfileAnalytics />} />
        <Route path="/profile/errors" element={<ErrorPatterns />} />
        <Route path="/profile/badges" element={<Badges />} />
        <Route path="/profile/subscription" element={<Subscription />} />
        <Route path="/subscription/verify" element={<SubscriptionVerify />} />
        <Route path="/profile/referrals" element={<Referrals />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsMain />} />
        <Route path="/settings/edit-profile" element={<EditProfileSettings />} />
        <Route path="/settings/change-password" element={<ChangePassword />} />
        <Route path="/settings/change-email" element={<ChangeEmail />} />
        <Route path="/settings/change-phone" element={<ChangePhone />} />
        <Route path="/settings/notifications" element={<NotificationPreferences />} />
        <Route path="/settings/do-not-disturb" element={<DoNotDisturb />} />
        <Route path="/settings/study-reminder" element={<StudyReminder />} />
        <Route path="/settings/explanation-level" element={<ExplanationLevel />} />
        <Route path="/settings/daily-target" element={<DailyTarget />} />
        <Route path="/settings/language" element={<LanguageSettings />} />
        <Route path="/settings/teaching-style" element={<TeachingStyle />} />
        <Route path="/settings/data-usage" element={<DataUsage />} />
        <Route path="/settings/offline-content" element={<OfflineContent />} />
        <Route path="/settings/profile-visibility" element={<ProfileVisibility />} />
        <Route path="/settings/data-sharing" element={<DataSharing />} />
        <Route path="/settings/download-data" element={<DownloadData />} />
        <Route path="/settings/help" element={<HelpCenter />} />
        <Route path="/settings/contact" element={<ContactSupport />} />
        <Route path="/settings/report-bug" element={<ReportBug />} />
        <Route path="/settings/terms" element={<TermsOfService />} />
        <Route path="/settings/privacy" element={<PrivacyPolicy />} />
        <Route path="/settings/delete-account" element={<DeleteAccount />} />
        <Route path="/notifications" element={<NotificationsCenter />} />
        <Route path="/search" element={<GlobalSearch />} />
        <Route path="/achievement" element={<AchievementPopup />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
        <Route path="/admin/users/:id" element={<AdminGuard><AdminUserDetail /></AdminGuard>} />
        <Route path="/admin/questions" element={<AdminGuard><AdminQuestions /></AdminGuard>} />
        <Route path="/admin/reports" element={<AdminGuard><AdminReports /></AdminGuard>} />
        <Route path="/admin/ai-corrections" element={<AdminGuard><AdminAICorrections /></AdminGuard>} />
        <Route path="/admin/analytics" element={<AdminGuard><AdminAnalytics /></AdminGuard>} />
        <Route path="/admin/health" element={<AdminGuard><AdminSystemHealth /></AdminGuard>} />
        <Route path="/admin/audit" element={<AdminGuard><AdminAudit /></AdminGuard>} />

        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/verify" element={<OTPVerification />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={
          <OnboardingProvider>
            <OnboardingGuard requireIncomplete={true}>
              <Welcome />
            </OnboardingGuard>
          </OnboardingProvider>
        } />
        <Route path="/onboarding/exam" element={
          <OnboardingProvider>
            <OnboardingGuard requireIncomplete={true}>
              <ExamSelection />
            </OnboardingGuard>
          </OnboardingProvider>
        } />
        <Route path="/onboarding/subjects" element={
          <OnboardingProvider>
            <OnboardingGuard requireIncomplete={true}>
              <SubjectSelection />
            </OnboardingGuard>
          </OnboardingProvider>
        } />
        <Route path="/onboarding/school" element={
          <OnboardingProvider>
            <OnboardingGuard requireIncomplete={true}>
              <SchoolName />
            </OnboardingGuard>
          </OnboardingProvider>
        } />
        <Route path="/onboarding/habits" element={
          <OnboardingProvider>
            <OnboardingGuard requireIncomplete={true}>
              <StudyHabits />
            </OnboardingGuard>
          </OnboardingProvider>
        } />
        <Route path="/onboarding/diagnostic-intro" element={
          <OnboardingGuard requireIncomplete={true}>
            <DiagnosticIntro />
          </OnboardingGuard>
        } />
        <Route path="/onboarding/diagnostic" element={
          <OnboardingGuard requireIncomplete={true}>
            <DiagnosticQuestion />
          </OnboardingGuard>
        } />
        <Route path="/onboarding/diagnostic/:id" element={
          <OnboardingGuard requireIncomplete={true}>
            <DiagnosticQuestion />
          </OnboardingGuard>
        } />
        <Route path="/onboarding/analyzing" element={
          <OnboardingGuard requireIncomplete={true}>
            <AnalyzingResults />
          </OnboardingGuard>
        } />
        <Route path="/onboarding/results" element={
          <OnboardingGuard requireIncomplete={true}>
            <ResultsReveal />
          </OnboardingGuard>
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
