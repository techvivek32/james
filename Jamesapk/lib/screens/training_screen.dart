import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class TrainingScreen extends StatefulWidget {
  const TrainingScreen({super.key});

  @override
  State<TrainingScreen> createState() => _TrainingScreenState();
}

class _TrainingScreenState extends State<TrainingScreen> {
  // Miller Storm Red Theme
  static const _bg = Color(0xFFF3F4F6);
  static const _white = Color(0xFFFFFFFF);
  static const _primary = Color(0xFFDC2626); // Miller Storm Red
  static const _textDark = Color(0xFF111827);
  static const _textMedium = Color(0xFF374151);
  static const _textLight = Color(0xFF6B7280);
  static const _textPlaceholder = Color(0xFF9CA3AF);
  static const _border = Color(0xFFD1D5DB);
  static const _link = Color(0xFFDC2626); // Miller Storm Red

  String _greeting = 'Good Morning';
  String _userName = 'Loading...';
  int _stormChatGroupCount = 0;
  String? _userId;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _setGreeting();
    _fetchStormChatGroups();
  }

  void _setGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      _greeting = 'Good Morning';
    } else if (hour < 17) {
      _greeting = 'Good Afternoon';
    } else {
      _greeting = 'Good Evening';
    }
  }

  Future<void> _loadUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr != null) {
        final user = jsonDecode(userStr);
        setState(() {
          _userName = user['name'] ?? 'User';
          _userId = user['_id'] ?? user['id'];
        });
        // Fetch groups after user data is loaded
        _fetchStormChatGroups();
      }
    } catch (e) {
      print('Error loading user data: $e');
      setState(() {
        _userName = 'User';
      });
    }
  }

  Future<void> _fetchStormChatGroups() async {
    if (_userId == null) return;
    
    try {
      final response = await http.get(
        Uri.parse('https://millerstorm.tech/api/storm-chat/groups'),
      );

      if (response.statusCode == 200) {
        final allGroups = json.decode(response.body) as List;
        
        // Filter groups where user is a member
        final userGroups = allGroups.where((group) {
          final members = List<String>.from(group['members'] ?? []);
          return members.contains(_userId);
        }).toList();

        setState(() {
          _stormChatGroupCount = userGroups.length;
        });
      }
    } catch (e) {
      print('Error fetching StormChat groups: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    _buildHeader(),
                    const SizedBox(height: 20),
                    _buildBootcampCard(),
                    const SizedBox(height: 24),
                    _buildAICoaches(),
                    const SizedBox(height: 24),
                    _buildPlaybooks(),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            _buildBottomNav(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: _border,
                  child: const Icon(Icons.person, size: 28, color: _textLight),
                ),
                Positioned(
                  bottom: 2,
                  right: 2,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                      border: Border.all(color: _white, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$_greeting,', style: const TextStyle(fontSize: 13, color: _textLight)),
                Text(_userName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
              ],
            ),
          ],
        ),
        Stack(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: _white,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8)],
              ),
              child: const Icon(Icons.notifications_outlined, color: _textMedium, size: 22),
            ),
            Positioned(
              top: 6,
              right: 6,
              child: Container(
                width: 9,
                height: 9,
                decoration: const BoxDecoration(color: Color(0xFFDC2626), shape: BoxShape.circle),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBootcampCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _primary,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -10,
            top: -10,
            child: Icon(Icons.bolt, size: 120, color: _white.withOpacity(0.08)),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'ACTION REQUIRED',
                  style: TextStyle(color: _white, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('7-Day Bootcamp', style: TextStyle(color: _white, fontSize: 24, fontWeight: FontWeight.w800)),
                      SizedBox(height: 4),
                      Text('Day 3: Mastering the Pitch', style: TextStyle(color: Color(0xCCFFFFFF), fontSize: 13)),
                    ],
                  ),
                  const Text('42%', style: TextStyle(color: _white, fontSize: 28, fontWeight: FontWeight.w800)),
                ],
              ),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: 0.42,
                  minHeight: 8,
                  backgroundColor: _white.withOpacity(0.2),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4ADE80)),
                ),
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                height: 48,
                decoration: BoxDecoration(
                  color: _white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Text(
                    'Resume Training',
                    style: TextStyle(color: _link, fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAICoaches() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.smart_toy_outlined, color: _link, size: 22),
            const SizedBox(width: 8),
            const Text('AI Coach & Tools', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildCoachCard(
                icon: Icons.school_outlined,
                iconBg: Color(0xFFEFF6FF),
                iconColor: _link,
                title: 'Training Center',
                subtitle: 'Courses',
                onTap: () => Navigator.pushNamed(context, '/courses'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildCoachCard(
                icon: Icons.apps_outlined,
                iconBg: Color(0xFFF0FDF4),
                iconColor: Color(0xFF16A34A),
                title: 'Apps & Tools',
                subtitle: 'Utilities',
                onTap: () {
                  // TODO: Navigate to apps & tools screen
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Apps & Tools coming soon!')),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCoachCard({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String subtitle,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: _textDark)),
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: _textLight)),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaybooks() {
    final playbooks = [
      {'title': 'AccuLynx Workflows', 'subtitle': 'Updated 2 days ago', 'icon': Icons.description_outlined},
      {'title': 'Post-Storm Inspection Guide', 'subtitle': 'Updated last week', 'icon': Icons.camera_outlined},
      {'title': 'Closing the Adjuster', 'subtitle': 'Updated 1 month ago', 'icon': Icons.handshake_outlined},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Icon(Icons.menu_book_outlined, color: _textDark, size: 22),
                const SizedBox(width: 8),
                const Text('Standard Playbooks', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
              ],
            ),
            const Text('View All', style: TextStyle(fontSize: 13, color: _link, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: _white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
          ),
          child: Column(
            children: playbooks.asMap().entries.map((entry) {
              final i = entry.key;
              final p = entry.value;
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: _bg,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(p['icon'] as IconData, size: 20, color: _textLight),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(p['title'] as String, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _textDark)),
                              Text(p['subtitle'] as String, style: const TextStyle(fontSize: 12, color: _textLight)),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, color: _textPlaceholder, size: 20),
                      ],
                    ),
                  ),
                  if (i < playbooks.length - 1)
                    const Divider(height: 1, indent: 68, color: _bg),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomNav(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _white,
        border: Border(top: BorderSide(color: _border, width: 1)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _navItem(Icons.school_outlined, 'Training', true, null, context),
              _navItemWithBadge(Icons.chat_bubble_outline, 'StormChat', _stormChatGroupCount, context),
              _navItem(Icons.emoji_events_outlined, 'Rankings', false, '/rankings', context),
              _navItem(Icons.work_outline, 'Planner', false, '/planner', context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(IconData icon, String label, bool active, String? route, BuildContext context) {
    return GestureDetector(
      onTap: route != null ? () => Navigator.pushReplacementNamed(context, route) : null,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: active ? _link : _textPlaceholder, size: 24),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 11, color: active ? _link : _textPlaceholder, fontWeight: active ? FontWeight.w600 : FontWeight.normal)),
        ],
      ),
    );
  }

  Widget _navItemWithBadge(IconData icon, String label, int badge, BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pushReplacementNamed(context, '/stormchat'),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(icon, color: _textPlaceholder, size: 24),
              if (badge > 0)
                Positioned(
                  top: -4,
                  right: -6,
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: const BoxDecoration(color: Color(0xFFDC2626), shape: BoxShape.circle),
                    child: Center(
                      child: Text('$badge', style: const TextStyle(color: _white, fontSize: 9, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 11, color: _textPlaceholder)),
        ],
      ),
    );
  }
}
