// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class AppLocalizationsHi extends AppLocalizations {
  AppLocalizationsHi([String locale = 'hi']) : super(locale);

  @override
  String get appName => 'स्कूल साथी';

  @override
  String get appTagline => 'अपने बच्चे के दिन से जुड़े रहें';

  @override
  String get signIn => 'साइन इन करें';

  @override
  String get signOut => 'साइन आउट';

  @override
  String get biometricSignIn => 'बायोमेट्रिक से साइन इन';

  @override
  String get biometricPrompt => 'स्कूल साथी अनलॉक करें';

  @override
  String get dashboard => 'होम';

  @override
  String get attendance => 'उपस्थिति';

  @override
  String get academics => 'शिक्षा';

  @override
  String get fees => 'फीस';

  @override
  String get inbox => 'इनबॉक्स';

  @override
  String get notices => 'सूचनाएँ';

  @override
  String get messages => 'संदेश';

  @override
  String get noAnnouncements => 'कोई सूचना नहीं';

  @override
  String get noConversations => 'अभी कोई बातचीत नहीं';

  @override
  String get noConversationsHint =>
      'शिक्षक नियुक्त होने पर आप संदेश भेज सकेंगे।';

  @override
  String get noChildLinked => 'इस खाते से कोई बच्चा नहीं जुड़ा';

  @override
  String get noChildLinkedHint =>
      'कृपया बच्चे को जोड़ने के लिए स्कूल से संपर्क करें।';

  @override
  String get noNewNotices => 'कोई नई सूचना नहीं';

  @override
  String get noUpcomingEvents => 'कोई आगामी कार्यक्रम नहीं';

  @override
  String get noAttendanceData => 'अभी उपस्थिति का डेटा नहीं है';

  @override
  String get todayAtAGlance => 'आज एक नज़र में';

  @override
  String get upcomingThisMonth => 'इस माह आगामी';

  @override
  String get seeAll => 'सभी देखें';

  @override
  String get switchChild => 'बच्चा बदलें';

  @override
  String get calendar => 'कैलेंडर';

  @override
  String get profile => 'प्रोफ़ाइल';

  @override
  String get language => 'भाषा';

  @override
  String get darkMode => 'डार्क मोड';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageHindi => 'हिन्दी';

  @override
  String get languageSystem => 'सिस्टम भाषा';

  @override
  String get themeLight => 'लाइट';

  @override
  String get themeDark => 'डार्क';

  @override
  String get themeSystem => 'सिस्टम';

  @override
  String get addToCalendar => 'डिवाइस कैलेंडर में जोड़ें';

  @override
  String get share => 'शेयर करें';

  @override
  String get download => 'डाउनलोड';

  @override
  String get receipt => 'रसीद';

  @override
  String get reportCard => 'रिपोर्ट कार्ड';

  @override
  String get applyForLeave => 'छुट्टी के लिए आवेदन करें';

  @override
  String get leaveHistory => 'छुट्टी इतिहास';

  @override
  String get paymentHistory => 'भुगतान इतिहास';

  @override
  String get outstanding => 'बकाया';

  @override
  String get totalPaid => 'कुल भुगतान';

  @override
  String get noPayments => 'अभी कोई भुगतान नहीं';

  @override
  String get noLeaveRequests => 'अभी कोई छुट्टी अनुरोध नहीं';

  @override
  String get notifications => 'सूचनाएँ';

  @override
  String get markAllRead => 'सभी को पढ़ा हुआ चिन्हित करें';

  @override
  String get noNotifications => 'अभी कोई सूचना नहीं';

  @override
  String get helpSupport => 'सहायता';

  @override
  String get privacySecurity => 'गोपनीयता व सुरक्षा';

  @override
  String get linkedChildren => 'जुड़े बच्चे';

  @override
  String get loading => 'लोड हो रहा है…';

  @override
  String get retry => 'पुनः प्रयास करें';

  @override
  String get cancel => 'रद्द करें';

  @override
  String get save => 'सहेजें';

  @override
  String get send => 'भेजें';

  @override
  String payNow(String amount) {
    return '$amount का भुगतान करें';
  }

  @override
  String get paymentSuccessful => 'भुगतान सफल';

  @override
  String get paymentFailed => 'भुगतान विफल। कृपया पुनः प्रयास करें।';

  @override
  String get paymentCancelled => 'भुगतान रद्द किया गया।';

  @override
  String get networkError =>
      'सर्वर से संपर्क नहीं हो सका। अपना कनेक्शन जाँचें।';

  @override
  String get unauthorized =>
      'आपका सत्र समाप्त हो गया है। कृपया दोबारा साइन इन करें।';

  @override
  String get serverError => 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।';

  @override
  String get typeMessage => 'संदेश लिखें';

  @override
  String get messagingOutsideHours =>
      'स्कूल समय के बाहर। संदेश स्कूल खुलने पर पहुँचेंगे।';

  @override
  String get skeletonLoading => 'लोड हो रहा है…';

  @override
  String get skip => 'छोड़ें';

  @override
  String get getStarted => 'शुरू करें';

  @override
  String get onboardingTitle1 => 'हर स्कूल दिन पर नज़र';

  @override
  String get onboardingBody1 => 'उपस्थिति, अंक और सूचनाएँ एक जगह।';

  @override
  String get onboardingTitle2 => 'सेकेंड में फीस भरें';

  @override
  String get onboardingBody2 =>
      'UPI, कार्ड, नेट-बैंकिंग से सुरक्षित भुगतान और तुरंत रसीदें।';

  @override
  String get onboardingTitle3 => 'कक्षा से जुड़े रहें';

  @override
  String get onboardingBody3 =>
      'शिक्षकों से चैट करें, रिमाइंडर पाएँ, कभी कोई कार्यक्रम न चूकें।';

  @override
  String get addedToCalendar => 'आपके कैलेंडर में जोड़ा गया';

  @override
  String get couldNotAddToCalendar => 'ईवेंट जोड़ा नहीं जा सका';

  @override
  String get copiedToClipboard => 'क्लिपबोर्ड पर कॉपी किया';

  @override
  String get present => 'उपस्थित';

  @override
  String get absent => 'अनुपस्थित';

  @override
  String get late => 'देर से';

  @override
  String get onLeave => 'छुट्टी पर';

  @override
  String get presentToday => 'आज उपस्थित';

  @override
  String get absentToday => 'आज अनुपस्थित';

  @override
  String get lateToday => 'आज देर से';

  @override
  String get onLeaveToday => 'आज छुट्टी पर';

  @override
  String get feesBreakdown => 'फीस विवरण';

  @override
  String get academicYear => 'शैक्षणिक वर्ष 2025–26';

  @override
  String get paid => 'भुगतान हो चुका';

  @override
  String get partial => 'आंशिक';

  @override
  String get due => 'देय';

  @override
  String get overdue => 'अति-देय';

  @override
  String get dueToday => 'आज देय';

  @override
  String dueInDays(Object days) {
    return '$days दिन में देय';
  }

  @override
  String overdueDays(Object days) {
    return '$days दिन अति-देय';
  }
}
