import 'package:flutter/material.dart';

class StormChatScreen extends StatelessWidget {
  const StormChatScreen({super.key});

  static const _bg = Color(0xFFF3F4F6);
  static const _white = Color(0xFFFFFFFF);
  static const _primary = Color(0xFFDC2626);
  static const _textDark = Color(0xFF111827);
  static const _textLight = Color(0xFF6B7280);
  static const _textPlaceholder = Color(0xFF9CA3AF);
  static const _border = Color(0xFFD1D5DB);
  static const _link = Color(0xFFDC2626);
  static const _avatarBg = Color(0xFFE0E7FF);

  static const _chats = [
    {
      'name': 'Dallas Til Dark',
      'emoji': '🌙',
      'pinned': true,
      'preview': 'Mark: Just wrapped up the neighbo...',
      'time': '9:24 AM',
      'unread': 3,
      'icon': '#',
      'locked': false,
    },
    {
      'name': 'All Reps',
      'emoji': null,
      'pinned': false,
      'preview': 'OS Bot: Leaderboard updated',
      'time': '10:00 AM',
      'unread': 0,
      'icon': '#',
      'locked': false,
    },
    {
      'name': 'Leadership',
      'emoji': null,
      'pinned': false,
      'preview': 'Sarah: Q2 targets looking great',
      'time': 'Yesterday',
      'unread': 1,
      'icon': '🔒',
      'locked': true,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Column(
                children: [
                  _buildHeader(),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _chats.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => _buildChatTile(_chats[i]),
                    ),
                  ),
                ],
              ),
            ),
            _buildBottomNav(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'StormChat',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: _textDark),
          ),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _white,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8)],
            ),
            child: const Icon(Icons.search, color: _textLight, size: 22),
          ),
        ],
      ),
    );
  }

  Widget _buildChatTile(Map<String, dynamic> chat) {
    final bool locked = chat['locked'] as bool;
    final int unread = chat['unread'] as int;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: _white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(color: _avatarBg, shape: BoxShape.circle),
            child: Center(
              child: locked
                  ? const Text('🔒', style: TextStyle(fontSize: 20))
                  : const Text('#', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: _primary)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      chat['name'] as String,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: _textDark),
                    ),
                    if (chat['emoji'] != null) ...[
                      const SizedBox(width: 4),
                      Text(chat['emoji'] as String, style: const TextStyle(fontSize: 14)),
                    ],
                    if (chat['pinned'] == true) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _bg,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: _border),
                        ),
                        child: const Text('PIN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _textLight)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  chat['preview'] as String,
                  style: const TextStyle(fontSize: 13, color: _textLight),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(chat['time'] as String, style: const TextStyle(fontSize: 12, color: _textLight)),
              const SizedBox(height: 6),
              if (unread > 0)
                Container(
                  width: 24,
                  height: 24,
                  decoration: const BoxDecoration(color: _primary, shape: BoxShape.circle),
                  child: Center(
                    child: Text('$unread', style: const TextStyle(color: _white, fontSize: 12, fontWeight: FontWeight.w700)),
                  ),
                )
              else
                const SizedBox(height: 24),
            ],
          ),
        ],
      ),
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
              _navItem(context, Icons.school_outlined, 'Training', false, '/training'),
              _navItemActive(Icons.chat_bubble_outline, 'StormChat'),
              _navItem(context, Icons.emoji_events_outlined, 'Rankings', false, '/rankings'),
              _navItem(context, Icons.work_outline, 'Planner', false, '/planner'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(BuildContext context, IconData icon, String label, bool active, String? route) {
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

  Widget _navItemActive(IconData icon, String label) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: _link, size: 24),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 11, color: _link, fontWeight: FontWeight.w600)),
          ],
        ),
        Positioned(
          top: -4,
          right: -6,
          child: Container(
            width: 16,
            height: 16,
            decoration: const BoxDecoration(color: Color(0xFFDC2626), shape: BoxShape.circle),
            child: const Center(
              child: Text('3', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700)),
            ),
          ),
        ),
      ],
    );
  }
}
