import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/auth_service.dart';

class LessonPlayerScreen extends StatefulWidget {
  final String courseId;
  final String courseTitle;
  final String lessonId;
  final String lessonTitle;

  const LessonPlayerScreen({
    super.key,
    required this.courseId,
    required this.courseTitle,
    required this.lessonId,
    required this.lessonTitle,
  });

  @override
  State<LessonPlayerScreen> createState() => _LessonPlayerScreenState();
}

class _LessonPlayerScreenState extends State<LessonPlayerScreen> {
  static const _bg = Color(0xFFF3F4F6);
  static const _white = Color(0xFFFFFFFF);
  static const _primary = Color(0xFFDC2626);
  static const _textDark = Color(0xFF111827);
  static const _textMedium = Color(0xFF374151);
  static const _textLight = Color(0xFF6B7280);
  static const _border = Color(0xFFD1D5DB);

  Map<String, dynamic>? _lesson;
  Map<String, dynamic>? _course;
  List<dynamic> _allLessons = [];
  int _currentLessonIndex = 0;
  bool _isLoading = true;
  bool _isFullscreen = false;
  WebViewController? _webViewController;

  @override
  void initState() {
    super.initState();
    _fetchLessonData();
  }

  Future<void> _fetchLessonData() async {
    try {
      final user = await AuthService.getStoredUser();
      final userId = user?['id'] ?? '';
      
      print('🎥 Fetching lesson: ${widget.lessonId} from course: ${widget.courseId}');
      
      // Get course data with lesson details
      final response = await http.get(
        Uri.parse('https://millerstorm.tech/api/courses/${widget.courseId}?userId=$userId'),
      );

      if (response.statusCode == 200) {
        final courseData = jsonDecode(response.body);
        final pages = courseData['pages'] as List<dynamic>? ?? [];
        
        // Filter only published lesson pages (not quizzes)
        final lessons = pages.where((page) => 
          page['status'] == 'published' && page['isQuiz'] != true
        ).toList();
        
        final currentIndex = lessons.indexWhere((page) => page['id'] == widget.lessonId);
        final lesson = currentIndex >= 0 ? lessons[currentIndex] : null;

        setState(() {
          _course = courseData;
          _lesson = lesson;
          _allLessons = lessons;
          _currentLessonIndex = currentIndex >= 0 ? currentIndex : 0;
          _isLoading = false;
        });
        
        print('✅ Lesson loaded: ${lesson?['title']}');
        print('🎥 Video URL: ${lesson?['videoUrl']}');
        
        // Initialize WebView for video
        if (lesson?['videoUrl'] != null) {
          _initializeWebView(lesson!['videoUrl']);
        }
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Error fetching lesson: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _initializeWebView(String videoUrl) {
    String embedUrl = _getEmbedUrl(videoUrl);
    
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse(embedUrl));
  }

  String _getEmbedUrl(String videoUrl) {
    // Convert various video URL formats to embeddable URLs
    if (videoUrl.contains('vimeo.com')) {
      final vimeoMatch = RegExp(r'vimeo\.com/(\d+)').firstMatch(videoUrl);
      if (vimeoMatch != null) {
        return 'https://player.vimeo.com/video/${vimeoMatch.group(1)}?autoplay=1&title=0&byline=0&portrait=0';
      }
    } else if (videoUrl.contains('youtube.com') || videoUrl.contains('youtu.be')) {
      final youtubeMatch = RegExp(r'(?:youtube\.com/watch\?v=|youtu\.be/)([^&\n?#]+)').firstMatch(videoUrl);
      if (youtubeMatch != null) {
        return 'https://www.youtube.com/embed/${youtubeMatch.group(1)}?autoplay=1&rel=0&modestbranding=1';
      }
    }
    
    // If it's already an embed URL or other format, use as is
    return videoUrl;
  }

  void _toggleFullscreen() {
    setState(() {
      _isFullscreen = !_isFullscreen;
    });
    
    if (_isFullscreen) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    } else {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    }
  }

  Future<void> _markCompleteAndNext() async {
    if (_lesson == null) return;
    
    try {
      final user = await AuthService.getStoredUser();
      final userId = user?['id'] ?? '';
      
      // Mark current lesson as complete
      await http.post(
        Uri.parse('https://millerstorm.tech/api/progress/save'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'courseId': widget.courseId,
          'pageId': _lesson!['id'],
        }),
      );
      
      print('✅ Lesson marked as complete: ${_lesson!['title']}');
      
      // Navigate to next lesson if available
      if (_currentLessonIndex < _allLessons.length - 1) {
        final nextLesson = _allLessons[_currentLessonIndex + 1];
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => LessonPlayerScreen(
              courseId: widget.courseId,
              courseTitle: widget.courseTitle,
              lessonId: nextLesson['id'],
              lessonTitle: nextLesson['title'],
            ),
          ),
        );
      } else {
        // Last lesson - go back to course detail
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Course completed!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('❌ Error marking lesson complete: $e');
    }
  }

  Future<void> _launchUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      print('❌ Error launching URL: $e');
    }
  }

  Widget _buildVideoPlayer() {
    if (_lesson?['videoUrl'] == null) {
      return Container(
        height: 220,
        color: Colors.black,
        child: const Center(
          child: Text(
            'No video available',
            style: TextStyle(color: Colors.white, fontSize: 16),
          ),
        ),
      );
    }

    return Container(
      height: _isFullscreen ? MediaQuery.of(context).size.height : 220,
      width: double.infinity,
      child: Stack(
        children: [
          // Real WebView video player
          if (_webViewController != null)
            WebViewWidget(controller: _webViewController!)
          else
            Container(
              color: Colors.black,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
          
          // Fullscreen toggle button
          if (!_isFullscreen)
            Positioned(
              top: 8,
              right: 8,
              child: GestureDetector(
                onTap: _toggleFullscreen,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(
                    Icons.fullscreen,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ),
            ),
          
          // Exit fullscreen button
          if (_isFullscreen)
            Positioned(
              top: 8,
              right: 8,
              child: GestureDetector(
                onTap: _toggleFullscreen,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(
                    Icons.fullscreen_exit,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLessonContent() {
    if (_lesson?['body'] == null || _lesson!['body'].toString().trim().isEmpty) {
      return const SizedBox();
    }

    // Parse HTML content (basic parsing)
    String content = _lesson!['body'];
    content = content.replaceAll(RegExp(r'<[^>]*>'), '');
    content = content.replaceAll('&nbsp;', ' ');
    content = content.replaceAll('&amp;', '&');
    content = content.replaceAll('&lt;', '<');
    content = content.replaceAll('&gt;', '>');
    content = content.trim();

    if (content.isEmpty) return const SizedBox();

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        content,
        style: const TextStyle(
          fontSize: 16,
          height: 1.5,
          color: _textMedium,
        ),
      ),
    );
  }

  Widget _buildResourceLinks() {
    final resourceLinks = _lesson?['resourceLinks'] as List<dynamic>? ?? [];
    final fileUrls = _lesson?['fileUrls'] as List<dynamic>? ?? [];
    
    if (resourceLinks.isEmpty && fileUrls.isEmpty) {
      return const SizedBox();
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Resources',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: _textDark,
            ),
          ),
          const SizedBox(height: 12),
          
          // Resource links
          ...resourceLinks.map((link) => GestureDetector(
            onTap: () => _launchUrl(link['href'] ?? ''),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _bg,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: _border.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.link, color: _primary, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      link['label'] ?? 'Resource Link',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: _textDark,
                      ),
                    ),
                  ),
                  Icon(Icons.open_in_new, color: _textLight, size: 14),
                ],
              ),
            ),
          )).toList(),
          
          // File downloads
          ...fileUrls.map((file) => GestureDetector(
            onTap: () => _launchUrl(file['href'] ?? ''),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _bg,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: _border.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.file_download, color: _primary, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      file['label'] ?? 'Download File',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: _textDark,
                      ),
                    ),
                  ),
                  Icon(Icons.download, color: _textLight, size: 14),
                ],
              ),
            ),
          )).toList(),
        ],
      ),
    );
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isFullscreen) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: _buildVideoPlayer(),
      );
    }

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.lessonTitle,
              style: const TextStyle(
                color: _textDark,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              widget.courseTitle,
              style: const TextStyle(
                color: _textLight,
                fontSize: 12,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: _primary))
          : Column(
              children: [
                // Video Player (full width, no padding)
                _buildVideoPlayer(),
                
                // Content below video
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Lesson content
                        _buildLessonContent(),
                        
                        // Resources
                        _buildResourceLinks(),
                        
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
                
                // Bottom action bar
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 8,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Progress indicator
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Lesson ${_currentLessonIndex + 1} of ${_allLessons.length}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: _textLight,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 4),
                            LinearProgressIndicator(
                              value: _allLessons.isNotEmpty ? (_currentLessonIndex + 1) / _allLessons.length : 0,
                              backgroundColor: _border,
                              valueColor: AlwaysStoppedAnimation<Color>(_primary),
                              minHeight: 3,
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(width: 16),
                      
                      // Next button
                      GestureDetector(
                        onTap: _markCompleteAndNext,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          decoration: BoxDecoration(
                            color: _primary,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _currentLessonIndex < _allLessons.length - 1 ? 'Next' : 'Complete',
                                style: const TextStyle(
                                  color: _white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                _currentLessonIndex < _allLessons.length - 1 
                                    ? Icons.arrow_forward 
                                    : Icons.check,
                                color: _white,
                                size: 16,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}