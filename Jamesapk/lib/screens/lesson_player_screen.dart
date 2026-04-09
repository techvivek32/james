import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
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
  bool _isLoading = true;
  bool _isFullscreen = false;

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
        final lesson = pages.firstWhere(
          (page) => page['id'] == widget.lessonId,
          orElse: () => null,
        );

        setState(() {
          _course = courseData;
          _lesson = lesson;
          _isLoading = false;
        });
        
        print('✅ Lesson loaded: ${lesson?['title']}');
        print('🎥 Video URL: ${lesson?['videoUrl']}');
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

  void _toggleFullscreen() {
    setState(() {
      _isFullscreen = !_isFullscreen;
    });
    
    if (_isFullscreen) {
      // Hide system UI for fullscreen
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    } else {
      // Show system UI
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
      ]);
    }
  }

  @override
  void dispose() {
    // Reset orientation when leaving screen
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    super.dispose();
  }

  Widget _buildVideoPlayer() {
    if (_lesson?['videoUrl'] == null) {
      return Container(
        height: 200,
        color: Colors.black,
        child: const Center(
          child: Text(
            'No video available',
            style: TextStyle(color: Colors.white, fontSize: 16),
          ),
        ),
      );
    }

    // Extract video ID from various URL formats
    String videoUrl = _lesson!['videoUrl'];
    String? videoId;
    
    if (videoUrl.contains('vimeo.com')) {
      // Vimeo URL
      final vimeoMatch = RegExp(r'vimeo\.com/(\d+)').firstMatch(videoUrl);
      if (vimeoMatch != null) {
        videoId = vimeoMatch.group(1);
        videoUrl = 'https://player.vimeo.com/video/$videoId';
      }
    } else if (videoUrl.contains('youtube.com') || videoUrl.contains('youtu.be')) {
      // YouTube URL
      final youtubeMatch = RegExp(r'(?:youtube\.com/watch\?v=|youtu\.be/)([^&\n?#]+)').firstMatch(videoUrl);
      if (youtubeMatch != null) {
        videoId = youtubeMatch.group(1);
        videoUrl = 'https://www.youtube.com/embed/$videoId';
      }
    }

    return Container(
      height: _isFullscreen ? MediaQuery.of(context).size.height : 220,
      width: double.infinity,
      color: Colors.black,
      child: Stack(
        children: [
          // Video iframe placeholder (you'll need to use webview_flutter package for actual video)
          Container(
            width: double.infinity,
            height: double.infinity,
            color: Colors.black87,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.play_circle_outline,
                  size: 80,
                  color: Colors.white.withOpacity(0.8),
                ),
                const SizedBox(height: 16),
                Text(
                  'Video Player',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tap to play video',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.6),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          
          // Fullscreen toggle button
          if (!_isFullscreen)
            Positioned(
              top: 16,
              right: 16,
              child: GestureDetector(
                onTap: _toggleFullscreen,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.fullscreen,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
          
          // Exit fullscreen button
          if (_isFullscreen)
            Positioned(
              top: 16,
              right: 16,
              child: GestureDetector(
                onTap: _toggleFullscreen,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.fullscreen_exit,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLessonContent() {
    if (_lesson?['body'] == null) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text(
          'No content available for this lesson.',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    // Parse HTML content (basic parsing - you might want to use flutter_html package)
    String content = _lesson!['body'];
    
    // Remove HTML tags for basic display
    content = content.replaceAll(RegExp(r'<[^>]*>'), '');
    content = content.replaceAll('&nbsp;', ' ');
    content = content.replaceAll('&amp;', '&');
    content = content.replaceAll('&lt;', '<');
    content = content.replaceAll('&gt;', '>');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
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
          Text(
            'Lesson Content',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: _textDark,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            content,
            style: const TextStyle(
              fontSize: 16,
              height: 1.6,
              color: _textMedium,
            ),
          ),
        ],
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
      padding: const EdgeInsets.all(20),
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
          const Text(
            'Resources',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: _textDark,
            ),
          ),
          const SizedBox(height: 16),
          
          // Resource links
          ...resourceLinks.map((link) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _bg,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _border.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.link, color: _primary, size: 20),
                const SizedBox(width: 12),
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
                Icon(Icons.open_in_new, color: _textLight, size: 16),
              ],
            ),
          )).toList(),
          
          // File downloads
          ...fileUrls.map((file) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _bg,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _border.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.file_download, color: _primary, size: 20),
                const SizedBox(width: 12),
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
                Icon(Icons.download, color: _textLight, size: 16),
              ],
            ),
          )).toList(),
        ],
      ),
    );
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
              child: Column(
                children: [
                  // Video Player (full width, no padding)
                  _buildVideoPlayer(),
                  
                  // Content below video
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Lesson content
                        _buildLessonContent(),
                        
                        const SizedBox(height: 16),
                        
                        // Resources
                        _buildResourceLinks(),
                        
                        const SizedBox(height: 32),
                        
                        // Action buttons
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                height: 50,
                                decoration: BoxDecoration(
                                  color: _primary,
                                  borderRadius: BorderRadius.circular(25),
                                ),
                                child: const Center(
                                  child: Text(
                                    'Mark as Complete',
                                    style: TextStyle(
                                      color: _white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              width: 50,
                              height: 50,
                              decoration: BoxDecoration(
                                color: _white,
                                borderRadius: BorderRadius.circular(25),
                                border: Border.all(color: _border),
                              ),
                              child: Icon(Icons.bookmark_border, color: _textMedium),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}