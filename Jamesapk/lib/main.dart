import 'package:flutter/material.dart';
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
import 'screens/profile_screen.dart';

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
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFDC2626)),
        fontFamily: 'sans-serif',
        useMaterial3: true,
      ),
      initialRoute: '/login',
      onGenerateRoute: (settings) {
        switch (settings.name) {
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
          case '/manager-stormchat':
            return MaterialPageRoute(builder: (_) => const ManagerStormChatScreen());
          case '/manager-rankings':
            return MaterialPageRoute(builder: (_) => const ManagerRankingsScreen());
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
            return MaterialPageRoute(builder: (_) => const LoginScreen());
        }
      },
    );
  }
}
