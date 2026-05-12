import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/training_screen.dart';
import 'screens/manager_dashboard_screen.dart';
import 'screens/storm_chat_screen.dart';
import 'screens/storm_chat_room_screen.dart';
import 'screens/rankings_screen.dart';
import 'screens/planner_screen.dart';
import 'screens/courses_screen.dart';
import 'screens/course_detail_screen.dart';
import 'screens/manager_storm_chat_screen.dart';
import 'screens/manager_rankings_screen.dart';
import 'screens/manager_planner_screen.dart';
import 'screens/manager_courses_screen.dart';
import 'screens/manager_training_screen.dart';
import 'screens/manager_profile_screen.dart';
import 'screens/manager_view_team_screen.dart';
import 'screens/manager_team_member_detail_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/apps_tools_items_screen.dart';
import 'screens/apps_tools_detail_screen.dart';
import 'screens/manager_apps_tools_items_screen.dart';
import 'screens/manager_apps_tools_detail_screen.dart';
import 'screens/manager_all_plans_screen.dart';
import 'screens/ai_clone_chat_screen.dart';

void main() {
  runApp(const MillerStormApp());
}

class MillerStormApp extends StatelessWidget {
  const MillerStormApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Miller Storm',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFCB0002)),
        fontFamily: 'sans-serif',
        useMaterial3: true,
      ),
      initialRoute: '/',
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/':
            return MaterialPageRoute(builder: (_) => const SplashScreen());
          case '/login':
            return MaterialPageRoute(builder: (_) => const LoginScreen());
          case '/training':
            return MaterialPageRoute(builder: (_) => const TrainingScreen());
          case '/manager-dashboard':
            return MaterialPageRoute(builder: (_) => const ManagerDashboardScreen());
          case '/stormchat':
            return MaterialPageRoute(builder: (_) => const StormChatScreen());
          case '/rankings':
            return MaterialPageRoute(builder: (_) => const RankingsScreen());
          case '/planner':
            return MaterialPageRoute(builder: (_) => const PlannerScreen());
          case '/courses':
            return MaterialPageRoute(builder: (_) => CoursesScreen());
          case '/apps-tools-items':
            return MaterialPageRoute(builder: (_) => const AppsToolsItemsScreen());
          case '/apps-tools-detail':
            return MaterialPageRoute(builder: (_) => const AppsToolsDetailScreen(), settings: settings);
          case '/manager-apps-tools-items':
            return MaterialPageRoute(builder: (_) => const ManagerAppsToolsItemsScreen());
          case '/manager-apps-tools-detail':
            return MaterialPageRoute(builder: (_) => const ManagerAppsToolsDetailScreen(), settings: settings);
          case '/manager-all-plans':
            final args = settings.arguments as Map<String, dynamic>;
            return MaterialPageRoute(
              builder: (_) => ManagerAllPlansScreen(
                teamMembers: args['teamMembers'],
                calculateMetrics: args['calculateMetrics'],
                onSavePlan: args['onSavePlan'],
                onRefresh: args['onRefresh'],
              ),
            );
          case '/manager-stormchat':
            return MaterialPageRoute(builder: (_) => const ManagerStormChatScreen());
          case '/manager-rankings':
            return MaterialPageRoute(builder: (_) => const ManagerRankingsScreen());
          case '/manager-view-team':
            return MaterialPageRoute(builder: (_) => const ManagerViewTeamScreen());
          case '/manager-team-member-detail':
            final member = settings.arguments as Map<String, dynamic>;
            return MaterialPageRoute(builder: (_) => ManagerTeamMemberDetailScreen(member: member));
          case '/manager-planner':
            return MaterialPageRoute(builder: (_) => const ManagerPlannerScreen());
          case '/manager-courses':
            return MaterialPageRoute(builder: (_) => const ManagerCoursesScreen());
          case '/manager-training':
            return MaterialPageRoute(builder: (_) => const ManagerTrainingScreen());
          case '/manager-profile':
            return MaterialPageRoute(builder: (_) => const ManagerProfileScreen());
          case '/profile':
            return MaterialPageRoute(builder: (_) => const ProfileScreen());
          default:
            return MaterialPageRoute(builder: (_) => const SplashScreen());
        }
      },
    );
  }
}
