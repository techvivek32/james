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

class _CoursesScreenState extends State<CoursesScreen> {
  static const _bg = Color(0xFFF3F4F6);
  static const _white = Color(0xFFFFFFFF);
  static const _primary = Color(0xFFDC2626);
  static const _textDark = Color(0xFF111827);
  static const _textLight = Color(0xFF6B7280);

  List<dynamic> _courses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCourses();
  }

  Future<void> _fetchCourses() async {
    try {
      // Get logged in user info
      final user = await AuthService.getStoredUser();
      final userId = user?['id'] ?? '';
      final userRole = user?['role'] ?? '';
      
      print('🔵 Fetching courses for user: $userId, role: $userRole');
      print('🔵 URL: https://millerstorm.tech/api/courses?userId=$userId&userRole=$userRole');
      
      final response = await http.get(
        Uri.parse('https://millerstorm.tech/api/courses?userId=$userId&userRole=$userRole'),
      );

      print('🔵 Courses response status: ${response.statusCode}');
      print('🔵 Courses response body: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}...');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Courses loaded: ${data is List ? data.length : 0} courses');
        
        // Print progress for each course
        if (data is List) {
          for (var course in data) {
            final progress = course['progress'];
            if (progress != null) {
              print('📊 ${course['title']}: ${progress['progressPercent']}%');
            } else {
              print('📊 ${course['title']}: No progress data');
            }
          }
        }
        
        // Sort courses by order field (web ni jem)
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
        print('❌ Failed to load courses: ${response.statusCode}');
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Error fetching courses: $e');
      setState(() {
        _isLoading = false;
      });
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
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: _primary))
          : _courses.isEmpty
              ? const Center(child: Text('No courses available'))
              : ListView.builder(
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
                          );
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

  IconData _getCourseIcon(String? iconText) {
    if (iconText == '🚪') return Icons.door_front_door;
    if (iconText == '🎯') return Icons.track_changes;
    return Icons.school_outlined;
  }

  Widget _buildCourseCard(String title, String progress, IconData icon, String? coverImageUrl) {
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
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: _textDark,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: int.parse(progress.replaceAll('%', '')) / 100,
                          minHeight: 6,
                          backgroundColor: const Color(0xFFD1D5DB),
                          valueColor: const AlwaysStoppedAnimation<Color>(_primary),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      progress,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: _textLight,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
