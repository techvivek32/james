import 'package:flutter/material.dart';

class StormChatGroupInfoScreen extends StatelessWidget {
  final dynamic group;
  final String userId;
  final String userRole;

  const StormChatGroupInfoScreen({
    Key? key,
    required this.group,
    required this.userId,
    required this.userRole,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: const Color(0xFFDC2626),
        elevation: 0,
        title: const Text(
          'Group Info',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Group Header
            Container(
              width: double.infinity,
              color: const Color(0xFFDC2626),
              padding: const EdgeInsets.only(bottom: 32),
              child: Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                      image: group['imageUrl'] != null && group['imageUrl'].isNotEmpty
                          ? DecorationImage(
                              image: NetworkImage('http://localhost:6790${group['imageUrl']}'),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: group['imageUrl'] == null || group['imageUrl'].isEmpty
                        ? const Center(
                            child: Text('👥', style: TextStyle(fontSize: 40)),
                          )
                        : null,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    group['name'] ?? 'Group',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (group['description'] != null && group['description'].isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Text(
                        group['description'],
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Group Stats
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      Text(
                        '${(group['members'] as List?)?.length ?? 0}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFDC2626),
                        ),
                      ),
                      const Text(
                        'Members',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    width: 1,
                    height: 40,
                    color: Colors.grey[300],
                  ),
                  Column(
                    children: [
                      Text(
                        '${(group['admins'] as List?)?.length ?? 0}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFDC2626),
                        ),
                      ),
                      const Text(
                        'Admins',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    width: 1,
                    height: 40,
                    color: Colors.grey[300],
                  ),
                  Column(
                    children: [
                      Icon(
                        group['onlyAdminCanChat'] == true ? Icons.lock : Icons.lock_open,
                        size: 20,
                        color: const Color(0xFFDC2626),
                      ),
                      Text(
                        group['onlyAdminCanChat'] == true ? 'Admin Only' : 'Open Chat',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Options
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.photo_library, color: Color(0xFFDC2626)),
                    title: const Text('Media, links, and docs'),
                    subtitle: const Text('Coming soon'),
                    trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Media gallery coming soon')),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.people, color: Color(0xFFDC2626)),
                    title: const Text('View members'),
                    subtitle: Text('${(group['members'] as List?)?.length ?? 0} members'),
                    trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Members list coming soon')),
                      );
                    },
                  ),
                  if (userRole == 'admin') ...[
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.settings, color: Color(0xFFDC2626)),
                      title: const Text('Group settings'),
                      subtitle: const Text('Admin only'),
                      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Group settings coming soon')),
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
            
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}