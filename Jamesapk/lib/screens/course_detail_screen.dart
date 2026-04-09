import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';

class CourseDetailScreen extends StatefulWidget {
  final String courseId;
  final String courseTitle;

  const CourseDetailScreen({
    super.key,
    required this.courseId,
    required this.courseTitle,
  });

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  static const _bg = Color(0xFFF3F4F6);
  static const _white = Color(0xFFFFFFFF);
  static const _primary = Color(0xFFDC2626);
  static const _textDark = Color(0xFF111827);
  static const _textMedium = Color(0xFF374151);
  static const _textLight = Color(0xFF6B7280);
  static const _border = Color(0xFFD1D5DB);

  Map<String, dynamic>? _course;
  bool _isLoading = true;
  int _completedLessons = 0;
  int _totalLessons = 0;
  int _progressPercent = 0;
  
  // Track which sections are expanded
  Set<int> _expandedSections = <int>{};

  @override
  void initState() {
    super.initState();
    _fetchCourseDetail();
  }

  Future<void> _fetchCourseDetail() async {
    try {
      final user = await AuthService.getStoredUser();
      final userId = user?['id'] ?? '';
      
      print('🔵 Fetching course detail: ${widget.courseId}');
      
      final response = await http.get(
        Uri.parse('https://millerstorm.tech/api/courses/${widget.courseId}?userId=$userId'),
      );

      print('🔵 Course detail response: ${response.statusCode}');
      print('🔵 Course detail body: ${response.body.substring(0, response.body.length > 300 ? 300 : response.body.length)}...');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _course = data;
          _completedLessons = data['progress']?['completedLessons'] ?? 0;
          _totalLessons = data['progress']?['totalLessons'] ?? 0;
          _progressPercent = data['progress']?['progressPercent'] ?? 0;
          _isLoading = false;
        });
        print('✅ Course loaded: ${data['title']}');
        print('📊 Progress: $_completedLessons/$_totalLessons ($_progressPercent%)');
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Error fetching course detail: $e');
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
        title: Text(
          widget.courseTitle,
          style: const TextStyle(color: _textDark, fontSize: 18, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, color: _textDark),
            onPressed: () {},
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: _primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTimerSection(),
                  const SizedBox(height: 24),
                  _buildProgressSection(),
                  const SizedBox(height: 24),
                  _buildContinueButton(),
                  const SizedBox(height: 32),
                  _buildCourseContent(),
                ],
              ),
            ),
    );
  }

  Widget _buildTimerSection() {
    return Container(
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
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.timer_outlined, color: _primary, size: 20),
              ),
              const SizedBox(width: 12),
              const Text(
                'Training Timer',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: _textDark),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _primary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Start Timer',
              style: TextStyle(color: _white, fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Course Progress',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: _textMedium),
        ),
        const SizedBox(height: 8),
        Text(
          'Completed $_completedLessons of $_totalLessons lessons',
          style: const TextStyle(fontSize: 14, color: _textLight),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _totalLessons > 0 ? _completedLessons / _totalLessons : 0,
                  minHeight: 8,
                  backgroundColor: _border,
                  valueColor: AlwaysStoppedAnimation<Color>(_primary),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              '$_progressPercent%',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _textDark),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildContinueButton() {
    return Container(
      width: double.infinity,
      height: 50,
      decoration: BoxDecoration(
        color: _textDark,
        borderRadius: BorderRadius.circular(25),
      ),
      child: const Center(
        child: Text(
          'Continue course',
          style: TextStyle(color: _white, fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  Widget _buildCourseContent() {
    if (_course == null) {
      return const SizedBox();
    }

    // Get folders from course data
    final folders = _course!['folders'] as List<dynamic>? ?? [];
    final pages = _course!['pages'] as List<dynamic>? ?? [];
    
    // If no folders, create sections from lessonNames or pages
    List<Map<String, dynamic>> sections = [];
    
    if (folders.isNotEmpty) {
      // Use actual folders from backend
      sections = folders.map<Map<String, dynamic>>((folder) {
        final folderPages = pages.where((page) => page['folderId'] == folder['id']).toList();
        return {
          'title': folder['title'] ?? 'Untitled Section',
          'lessons': folderPages.length,
          'pages': folderPages,
        };
      }).toList();
    } else if (pages.isNotEmpty) {
      // Group pages by some logic or show all as one section
      sections = [
        {
          'title': 'Course Content',
          'lessons': pages.length,
          'pages': pages,
        }
      ];
    } else {
      // Fallback to mock sections if no structured data
      sections = [
        {'title': 'Course Materials', 'lessons': _totalLessons, 'pages': []},
      ];
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Course Content',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _textDark),
        ),
        const SizedBox(height: 8),
        Text(
          '${sections.length} Sections • $_totalLessons Lessons',
          style: const TextStyle(fontSize: 14, color: _textLight),
        ),
        const SizedBox(height: 16),
        Container(
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
            children: sections.asMap().entries.map((entry) {
              final index = entry.key;
              final section = entry.value;
              final isExpanded = _expandedSections.contains(index);
              final sectionPages = section['pages'] as List<dynamic>? ?? [];
              
              return Column(
                children: [
                  // Section Header (Clickable)
                  InkWell(
                    onTap: () {
                      setState(() {
                        if (isExpanded) {
                          _expandedSections.remove(index);
                        } else {
                          _expandedSections.add(index);
                        }
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      child: Row(
                        children: [
                          AnimatedRotation(
                            turns: isExpanded ? 0.25 : 0,
                            duration: const Duration(milliseconds: 200),
                            child: Icon(
                              Icons.chevron_right,
                              color: _textMedium,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  section['title'] as String,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: _textDark,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                if (section['lessons'] > 0)
                                  Text(
                                    '${section['lessons']} lessons',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: _textLight,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: _bg,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${section['lessons']}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _textMedium,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  // Expandable Content with Animation
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                    height: isExpanded && sectionPages.isNotEmpty ? null : 0,
                    child: isExpanded && sectionPages.isNotEmpty
                        ? Container(
                            color: const Color(0xFFFAFAFA),
                            padding: const EdgeInsets.only(top: 8, bottom: 16),
                            child: Column(
                              children: sectionPages.asMap().entries.map<Widget>((pageEntry) {
                                final pageIndex = pageEntry.key;
                                final page = pageEntry.value;
                                final isCompleted = false; // You can add completion logic here
                                
                                return Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: _white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: _border.withOpacity(0.3)),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 32,
                                        height: 32,
                                        decoration: BoxDecoration(
                                          color: isCompleted ? _primary : _bg,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          page['isQuiz'] == true 
                                              ? Icons.quiz_outlined
                                              : isCompleted 
                                                  ? Icons.check 
                                                  : Icons.play_arrow,
                                          size: 16,
                                          color: isCompleted ? _white : _textLight,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              page['title'] ?? 'Lesson ${pageIndex + 1}',
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w500,
                                                color: isCompleted ? _textMedium : _textDark,
                                                decoration: isCompleted ? TextDecoration.lineThrough : null,
                                              ),
                                            ),
                                            if (page['videoUrl'] != null)
                                              const SizedBox(height: 2),
                                            if (page['videoUrl'] != null)
                                              Row(
                                                children: [
                                                  Icon(
                                                    Icons.videocam_outlined,
                                                    size: 12,
                                                    color: _textLight,
                                                  ),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    'Video lesson',
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      color: _textLight,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                          ],
                                        ),
                                      ),
                                      if (page['isQuiz'] == true)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.orange.withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            'Quiz',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.orange.shade700,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          )
                        : const SizedBox(),
                  ),
                  
                  // Divider (except for last item)
                  if (index < sections.length - 1)
                    Divider(height: 1, color: _border, indent: 16, endIndent: 16),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}