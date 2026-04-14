import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/training_screen.dart';
import 'screens/storm_chat_screen.dart';
import 'screens/storm_chat_room_screen.dart';
import 'screens/rankings_screen.dart';
import 'screens/planner_screen.dart';
import 'screens/courses_screen.dart';
import 'screens/course_detail_screen.dart';

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
          case '/stormchat':
            return MaterialPageRoute(builder: (_) => const StormChatScreen());
          case '/rankings':
            return MaterialPageRoute(builder: (_) => const RankingsScreen());
          case '/planner':
            return MaterialPageRoute(builder: (_) => const PlannerScreen());
          case '/courses':
            return MaterialPageRoute(builder: (_) => CoursesScreen());
          default:
            return MaterialPageRoute(builder: (_) => const LoginScreen());
        }
      },
    );
  }
}
