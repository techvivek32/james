import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/training_screen.dart';
import 'screens/stormchat_screen.dart';
import 'screens/rankings_screen.dart';
import 'screens/planner_screen.dart';

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
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1D4ED8)),
        fontFamily: 'sans-serif',
        useMaterial3: true,
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/training': (context) => const TrainingScreen(),
        '/stormchat': (context) => const StormChatScreen(),
        '/rankings': (context) => const RankingsScreen(),
        '/planner': (context) => const PlannerScreen(),
      },
    );
  }
}
