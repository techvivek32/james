import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';
import 'course_detail_screen.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> with SingleTickerProviderStateMixin {
  static const _bg = Color(0xFFF3F4F6);
  static const _white = Color(0xFFFFFFFF);
  static const _primary = Color(0xFFCB0002);
  static const _textDark = Color(0xFF111827);
  static const _textLight = Color(0xFF6B7280);
  static const _blue = Color(0xFF2563EB);

  List<dynamic> _courses = [];
  List<dynamic> _myPlaylists = [];
  List<dynamic> _assignedPlaylists = [];
  bool _isLoading = true;
  late TabController _tabController;
  String? _userId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final user = await AuthService.getStoredUser();
    _userId = user?['id'] ?? user?['_id'] ?? '';
    await Future.wait([
      _fetchCourses(),
      _fetchMyPlaylists(),
      _fetchAssignedPlaylists(),
    ]);
  }

  Future<void> _fetchCourses() async {
    try {
      final user = await AuthService.getStoredUser();
      final userId = user?['id'] ?? '';
      final userRole = user?['role'] ?? '';
      
      final response = await http.get(
        Uri.parse('https://millerstorm.tech/api/courses?userId=$userId&userRole=$userRole'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        List<dynamic> courses = data is List ? data : [];
        courses.sort((a, b) {
          final orderA = a['order'] ?? 999;
          final orderB = b['order'] ?? 999;
          return orderA.compareTo(orderB);
        });
        
        setState(() {
          _courses = courses;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      print('Error fetching courses: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchMyPlaylists() async {
    if (_userId == null || _userId!.isEmpty) return;
    try {
      final response = await http.get(
        Uri.parse('https://millerstorm.tech/api/playlists?managerId=$_userId'),
      );
      if (response.statusCode == 200) {
        setState(() {
          _myPlaylists = jsonDecode(response.body);
        });
      }
    } catch (e) {
      print('Error fetching my playlists: $e');
    }
  }

  Future<void> _fetchAssignedPlaylists() async {
    if (_userId == null || _userId!.isEmpty) return;
    try {
      final response = await http.get(
        Uri.parse('https://millerstorm.tech/api/playlist-assignments?userId=$_userId'),
      );
      if (response.statusCode == 200) {
        setState(() {
          _assignedPlaylists = jsonDecode(response.body);
        });
      }
    } catch (e) {
      print('Error fetching assigned playlists: $e');
    }
  }

  Future<void> _deletePlaylist(String playlistId) async {
    try {
      final response = await http.delete(
        Uri.parse('https://millerstorm.tech/api/playlists?id=$playlistId'),
      );
      if (response.statusCode == 200) {
        await _fetchMyPlaylists();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Playlist deleted successfully')),
        );
      }
    } catch (e) {
      print('Error deleting playlist: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Training Center',
          style: TextStyle(color: _textDark, fontSize: 18, fontWeight: FontWeight.w700),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: _blue,
          unselectedLabelColor: _textLight,
          indicatorColor: _blue,
          labelStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'Courses'),
            Tab(text: 'My Playlists'),
            Tab(text: 'Assigned'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildCoursesTab(),
          _buildMyPlaylistsTab(),
          _buildAssignedPlaylistsTab(),
        ],
      ),
    );
  }

  Widget _buildCoursesTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: _primary));
    }
    if (_courses.isEmpty) {
      return const Center(child: Text('No courses available'));
    }
    return RefreshIndicator(
      color: _primary,
      onRefresh: () async {
        setState(() => _isLoading = true);
        await _loadData();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _courses.length,
        itemBuilder: (context, index) {
          final course = _courses[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CourseDetailScreen(
                      courseId: course['id'] ?? '',
                      courseTitle: course['title'] ?? 'Course',
                    ),
                  ),
                ).then((_) => _loadData());
              },
              child: _buildCourseCard(
                course['title'] ?? 'Untitled',
                '${course['progress']?['progressPercent'] ?? 0}%',
                _getCourseIcon(course['icon']),
                course['coverImageUrl'],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildMyPlaylistsTab() {
    if (_myPlaylists.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.playlist_add, size: 64, color: _textLight.withOpacity(0.3)),
              const SizedBox(height: 16),
              const Text(
                'No Playlists Yet',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: _textDark),
              ),
              const SizedBox(height: 8),
              Text(
                'Create a playlist by clicking "Make Playlist" when viewing a course',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: _textLight),
              ),
            ],
          ),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _myPlaylists.length,
      itemBuilder: (context, index) {
        final playlist = _myPlaylists[index];
        return _buildPlaylistCard(playlist, false);
      },
    );
  }

  Widget _buildAssignedPlaylistsTab() {
    if (_assignedPlaylists.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.assignment, size: 64, color: _textLight.withOpacity(0.3)),
              const SizedBox(height: 16),
              const Text(
                'No Assigned Playlists',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: _textDark),
              ),
              const SizedBox(height: 8),
              Text(
                'Your manager hasn\'t assigned any playlists yet',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: _textLight),
              ),
            ],
          ),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _assignedPlaylists.length,
      itemBuilder: (context, index) {
        final assignment = _assignedPlaylists[index];
        return _buildPlaylistCard(assignment, true);
      },
    );
  }

  Widget _buildPlaylistCard(Map<String, dynamic> data, bool isAssigned) {
    final playlistName = isAssigned ? data['playlistName'] : data['name'];
    final courseName = data['courseName'];
    final moduleCount = (data['selectedModules'] as List?)?.length ?? 0;
    final managerName = isAssigned ? data['managerName'] : null;
    final playlistId = data['_id'] ?? data['id'];
    final courseId = data['courseId'];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      playlistName ?? 'Untitled Playlist',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: _textDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Course: $courseName',
                      style: const TextStyle(fontSize: 13, color: _textLight),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$moduleCount module${moduleCount != 1 ? 's' : ''}',
                      style: const TextStyle(fontSize: 13, color: _textLight),
                    ),
                    if (managerName != null) const SizedBox(height: 2),
                    if (managerName != null) Text(
                      'Assigned by: $managerName',
                      style: TextStyle(
                        fontSize: 12,
                        color: _textLight,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    // Navigate to course detail with playlist filter
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CourseDetailScreen(
                          courseId: courseId,
                          courseTitle: courseName,
                          playlistModules: List<String>.from(data['selectedModules'] ?? []),
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primary,
                    foregroundColor: _white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('View'),
                ),
              ),
              if (!isAssigned) const SizedBox(width: 8),
              if (!isAssigned) ElevatedButton(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Delete Playlist'),
                        content: const Text('Are you sure you want to delete this playlist?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.pop(context);
                              _deletePlaylist(playlistId);
                            },
                            child: const Text('Delete', style: TextStyle(color: Colors.red)),
                          ),
                        ],
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red.shade50,
                    foregroundColor: Colors.red,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Delete'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _getCourseIcon(String? iconText) {
    if (iconText == '🚪') return Icons.door_front_door;
    if (iconText == '🎯') return Icons.track_changes;
    return Icons.school_outlined;
  }

  Widget _buildCourseCard(String title, String progress, IconData icon, String? coverImageUrl) {
    final progressValue = int.parse(progress.replaceAll('%', ''));
    String statusText = '';
    Color statusColor = _primary;
    
    if (progressValue == 100) {
      statusText = 'COMPLETED';
      statusColor = const Color(0xFF16A34A); // Green
    } else if (progressValue == 0) {
      statusText = 'NOT STARTED';
      statusColor = const Color(0xFF6B7280); // Gray
    } else {
      statusText = 'IN PROGRESS';
      statusColor = _primary; // Red
    }
    
    return Container(
      decoration: BoxDecoration(
        color: _white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Container(
                height: 160,
                decoration: BoxDecoration(
                  gradient: coverImageUrl == null || coverImageUrl.isEmpty
                      ? LinearGradient(
                          colors: [_primary, _primary.withOpacity(0.8)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                ),
                child: coverImageUrl != null && coverImageUrl.isNotEmpty
                    ? ClipRRect(
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(16),
                          topRight: Radius.circular(16),
                        ),
                        child: coverImageUrl.startsWith('data:image/')
                            ? Image.memory(
                                base64Decode(coverImageUrl.split(',')[1]),
                                width: double.infinity,
                                height: 160,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [_primary, _primary.withOpacity(0.8)],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                    ),
                                    child: Center(
                                      child: Icon(icon, size: 64, color: _white),
                                    ),
                                  );
                                },
                              )
                            : Image.network(
                                coverImageUrl,
                                width: double.infinity,
                                height: 160,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [_primary, _primary.withOpacity(0.8)],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                    ),
                                    child: Center(
                                      child: Icon(icon, size: 64, color: _white),
                                    ),
                                  );
                                },
                              ),
                      )
                    : Center(
                        child: Icon(icon, size: 64, color: _white),
                      ),
              ),
              Positioned(
                top: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    statusText,
                    style: const TextStyle(
                      color: _white,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: _textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
