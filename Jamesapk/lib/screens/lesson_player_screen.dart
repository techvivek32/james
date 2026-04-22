import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:cached_network_image/cached_network_image.dart';
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
  static const _primary = Color(0xFFCB0002);
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
        
        // Initialize video player
        if (lesson?['videoUrl'] != null) {
          _initializeVideoPlayer(lesson!['videoUrl']);
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

  void _initializeVideoPlayer(String videoUrl) {
    String embedUrl = _getEmbedUrl(videoUrl);
    
    print('🎥 Initializing video player with URL: $embedUrl');
    
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..enableZoom(false)
      ..setUserAgent('Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36')
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            print('🔄 Video page started loading: $url');
          },
          onPageFinished: (String url) {
            print('✅ Video page loaded: $url');
            // Inject JavaScript to prevent auto-pause
            _webViewController?.runJavaScript('''
              // Disable media session handlers that cause auto-pause
              if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('pause', null);
                navigator.mediaSession.setActionHandler('stop', null);
              }
              
              // Find and configure video elements
              setTimeout(function() {
                var videos = document.querySelectorAll('video');
                videos.forEach(function(video) {
                  video.setAttribute('playsinline', 'true');
                  video.setAttribute('webkit-playsinline', 'true');
                  video.removeAttribute('controls');
                  
                  // Re-add controls after a delay
                  setTimeout(function() {
                    video.setAttribute('controls', 'true');
                  }, 1000);
                });
              }, 2000);
            ''');
          },
          onWebResourceError: (WebResourceError error) {
            print('❌ Video load error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(embedUrl));
  }

  String _getEmbedUrl(String videoUrl) {
    print('🔗 Original video URL: $videoUrl');
    
    // Convert various video URL formats to embeddable URLs
    if (videoUrl.contains('vimeo.com')) {
      // Extract video ID and hash from various Vimeo URL formats
      final vimeoMatch = RegExp(r'vimeo\.com/(\d+)(?:/([a-zA-Z0-9]+))?').firstMatch(videoUrl);
      if (vimeoMatch != null) {
        final videoId = vimeoMatch.group(1);
        final hash = vimeoMatch.group(2);
        // Use Vimeo player with autoplay enabled and playsinline enabled
        final embedUrl = hash != null 
          ? 'https://player.vimeo.com/video/$videoId?h=$hash&autoplay=1&playsinline=1&controls=1'
          : 'https://player.vimeo.com/video/$videoId?autoplay=1&playsinline=1&controls=1';
        print('✅ Vimeo embed URL: $embedUrl');
        return embedUrl;
      }
    } else if (videoUrl.contains('youtube.com') || videoUrl.contains('youtu.be')) {
      final youtubeMatch = RegExp(r'(?:youtube\.com/watch\?v=|youtu\.be/)([^&\n?#]+)').firstMatch(videoUrl);
      if (youtubeMatch != null) {
        final embedUrl = 'https://www.youtube.com/embed/${youtubeMatch.group(1)}?autoplay=1&playsinline=1&controls=1';
        print('✅ YouTube embed URL: $embedUrl');
        return embedUrl;
      }
    }
    
    // If it's already an embed URL or other format, use as is
    print('✅ Using original URL');
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
      color: Colors.black,
      child: _webViewController != null
          ? WebViewWidget(controller: _webViewController!)
          : const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
    );
  }

  Widget _buildLessonContent() {
    if (_lesson?['body'] == null || _lesson!['body'].toString().trim().isEmpty) {
      return const SizedBox();
    }

    String htmlContent = _lesson!['body'];
    
    // Remove video containers (video is shown separately at top)
    htmlContent = htmlContent.replaceAll(RegExp(r'<div[^>]*data-video-type[^>]*>.*?</div>', dotAll: true), '');
    
    // Remove delete buttons and their SVG icons, but keep images
    htmlContent = htmlContent.replaceAll(RegExp(r'<button[^>]*data-image-delete[^>]*>.*?</button>', dotAll: true), '');
    htmlContent = htmlContent.replaceAll(RegExp(r'<button[^>]*data-video-delete[^>]*>.*?</button>', dotAll: true), '');
    htmlContent = htmlContent.replaceAll(RegExp(r'<button[^>]*data-video-share[^>]*>.*?</button>', dotAll: true), '');
    
    // Remove excessive empty paragraphs and breaks
    htmlContent = htmlContent.replaceAll(RegExp(r'(<p>\s*<br\s*/?>\s*</p>\s*){2,}'), '<p><br></p>');
    htmlContent = htmlContent.replaceAll(RegExp(r'(<br\s*/?>\s*){4,}'), '<br><br>');
    
    // Fix image URLs to be absolute
    htmlContent = htmlContent.replaceAll(
      RegExp(r'<img\s+src="/uploads/'),
      '<img src="https://millerstorm.tech/uploads/'
    );
    
    // Check if content is empty after cleanup
    String testContent = htmlContent.replaceAll(RegExp(r'<[^>]*>'), '').trim();
    if (testContent.isEmpty) return const SizedBox();

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Html(
        data: htmlContent,
        style: {
          "body": Style(
            margin: Margins.zero,
            padding: HtmlPaddings.zero,
            fontSize: FontSize(15),
            lineHeight: LineHeight(1.6),
            color: _textMedium,
          ),
          "h1": Style(
            fontSize: FontSize(22),
            fontWeight: FontWeight.bold,
            color: _textDark,
            margin: Margins.only(top: 12, bottom: 10),
          ),
          "h2": Style(
            fontSize: FontSize(18),
            fontWeight: FontWeight.bold,
            color: _textDark,
            margin: Margins.only(top: 16, bottom: 8),
          ),
          "h3": Style(
            fontSize: FontSize(16),
            fontWeight: FontWeight.w600,
            color: _textDark,
            margin: Margins.only(top: 14, bottom: 8),
          ),
          "h4": Style(
            fontSize: FontSize(15),
            fontWeight: FontWeight.w600,
            color: _textDark,
            margin: Margins.only(top: 12, bottom: 6),
          ),
          "p": Style(
            fontSize: FontSize(15),
            lineHeight: LineHeight(1.6),
            color: _textMedium,
            margin: Margins.only(bottom: 10),
          ),
          "div": Style(
            margin: Margins.only(bottom: 8),
          ),
          "span": Style(
            fontSize: FontSize(15),
            lineHeight: LineHeight(1.6),
          ),
          "ul": Style(
            margin: Margins.only(left: 8, bottom: 10),
            padding: HtmlPaddings.only(left: 16),
          ),
          "ol": Style(
            margin: Margins.only(left: 8, bottom: 10),
            padding: HtmlPaddings.only(left: 16),
          ),
          "li": Style(
            fontSize: FontSize(15),
            lineHeight: LineHeight(1.6),
            color: _textMedium,
            margin: Margins.only(bottom: 6),
          ),
          "strong": Style(
            fontWeight: FontWeight.bold,
            color: _textDark,
          ),
          "b": Style(
            fontWeight: FontWeight.bold,
            color: _textDark,
          ),
          "em": Style(
            fontStyle: FontStyle.italic,
          ),
          "i": Style(
            fontStyle: FontStyle.italic,
          ),
          "a": Style(
            color: _primary,
            textDecoration: TextDecoration.underline,
          ),
          "img": Style(
            width: Width(100, Unit.percent),
            height: Height.auto(),
            margin: Margins.only(top: 12, bottom: 12),
            display: Display.block,
          ),
          "hr": Style(
            margin: Margins.only(top: 16, bottom: 16),
            border: Border(bottom: BorderSide(color: _border, width: 1)),
          ),
          "blockquote": Style(
            margin: Margins.only(left: 12, top: 10, bottom: 10),
            padding: HtmlPaddings.only(left: 12),
            border: Border(left: BorderSide(color: _primary, width: 3)),
            backgroundColor: _bg,
          ),
          "code": Style(
            backgroundColor: _bg,
            padding: HtmlPaddings.all(4),
            fontFamily: 'monospace',
          ),
          "pre": Style(
            backgroundColor: _bg,
            padding: HtmlPaddings.all(12),
            margin: Margins.only(bottom: 10),
          ),
        },
        extensions: [
          TagExtension(
            tagsToExtend: {"img"},
            builder: (extensionContext) {
              final src = extensionContext.attributes['src'] ?? '';
              print('🖼️ Image src: $src');
              
              if (src.isEmpty) {
                print('❌ Empty image src');
                return const SizedBox();
              }
              
              return Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: src,
                    fit: BoxFit.cover,
                    placeholder: (context, url) {
                      print('⏳ Loading image: $url');
                      return Container(
                        height: 200,
                        color: _bg,
                        child: const Center(
                          child: CircularProgressIndicator(color: _primary),
                        ),
                      );
                    },
                    errorWidget: (context, url, error) {
                      print('❌ Image load error: $url');
                      print('❌ Error details: $error');
                      return Container(
                        padding: const EdgeInsets.all(16),
                        color: _bg,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.image_not_supported, color: _textLight, size: 48),
                            const SizedBox(height: 8),
                            Text(
                              'Image not available',
                              style: TextStyle(color: _textLight, fontSize: 14),
                            ),
                            Text(
                              url,
                              style: TextStyle(color: _textLight, fontSize: 10),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              );
            },
          ),
        ],
        onLinkTap: (url, attributes, element) {
          if (url != null) {
            _launchUrl(url);
          }
        },
      ),
    );
  }

  Widget _buildResourceLinks() {
    final resourceLinks = _lesson?['resourceLinks'] as List<dynamic>? ?? [];
    final fileUrls = _lesson?['fileUrls'] as List<dynamic>? ?? [];
    
    // Show Resources section if there are any links or files
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
          ...fileUrls.map((file) {
            final href = file['href'] ?? '';
            final label = file['label'] ?? 'Download File';
            final fullUrl = href.startsWith('http') ? href : 'https://millerstorm.tech$href';
            
            return GestureDetector(
              onTap: () => _launchUrl(fullUrl),
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
                        label,
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
            );
          }).toList(),
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
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    child: Column(
                      children: [
                        // Lesson content
                        _buildLessonContent(),
                        
                        // Resources
                        _buildResourceLinks(),
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
