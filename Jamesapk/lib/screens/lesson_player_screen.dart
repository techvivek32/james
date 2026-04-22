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
  
  // Quiz state
  Map<String, int> _selectedAnswers = {};
  bool _quizSubmitted = false;
  Map<String, dynamic>? _quizScore;
  List<dynamic> _savedQuizResults = [];

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
        
        // Filter only published pages (including quizzes)
        var lessons = pages.where((page) => 
          page['status'] == 'published'
        ).toList();
        
        // Sort pages by folder order to ensure quizzes appear in correct sequence
        final folders = courseData['folders'] as List<dynamic>? ?? [];
        if (folders.isNotEmpty) {
          // Create a map of folderId to folder index for sorting
          final folderIndexMap = <String, int>{};
          for (var i = 0; i < folders.length; i++) {
            folderIndexMap[folders[i]['id']] = i;
          }
          
          // Sort pages: first by folder order, then pages without folders at the end
          lessons.sort((a, b) {
            final aFolderId = a['folderId'];
            final bFolderId = b['folderId'];
            
            // If both have folders, sort by folder index
            if (aFolderId != null && bFolderId != null) {
              final aIndex = folderIndexMap[aFolderId] ?? 999;
              final bIndex = folderIndexMap[bFolderId] ?? 999;
              return aIndex.compareTo(bIndex);
            }
            
            // Pages with folders come before pages without folders
            if (aFolderId != null && bFolderId == null) return -1;
            if (aFolderId == null && bFolderId != null) return 1;
            
            // Both without folders, maintain original order
            return 0;
          });
        }
        
        print('📚 Total pages loaded: ${lessons.length}');
        for (var i = 0; i < lessons.length; i++) {
          print('  [$i] ${lessons[i]['title']} - isQuiz: ${lessons[i]['isQuiz']} - folderId: ${lessons[i]['folderId']}');
        }
        
        final currentIndex = lessons.indexWhere((page) => page['id'] == widget.lessonId);
        final lesson = currentIndex >= 0 ? lessons[currentIndex] : null;

        // Load saved progress (including quiz results)
        List<dynamic> savedQuizResults = [];
        if (userId.isNotEmpty) {
          try {
            final progressResponse = await http.get(
              Uri.parse('https://millerstorm.tech/api/progress?userId=$userId&courseId=${widget.courseId}'),
            );
            if (progressResponse.statusCode == 200) {
              final progressData = jsonDecode(progressResponse.body);
              savedQuizResults = progressData['quizResults'] ?? [];
              print('📊 Loaded ${savedQuizResults.length} saved quiz results');
            }
          } catch (e) {
            print('⚠️ Could not load progress: $e');
          }
        }

        setState(() {
          _course = courseData;
          _lesson = lesson;
          _allLessons = lessons;
          _currentLessonIndex = currentIndex >= 0 ? currentIndex : 0;
          _savedQuizResults = savedQuizResults;
          _isLoading = false;
          
          // If this is a quiz, check if user already completed it
          if (lesson?['isQuiz'] == true) {
            final savedResult = savedQuizResults.firstWhere(
              (r) => r['pageId'] == lesson!['id'],
              orElse: () => null,
            );
            
            if (savedResult != null) {
              print('✅ Found saved quiz result');
              _selectedAnswers = Map<String, int>.from(savedResult['answers'] ?? {});
              _quizScore = savedResult['score'];
              _quizSubmitted = true;
            }
          }
        });
        
        print('✅ Lesson loaded: ${lesson?['title']}');
        print('🎥 Video URL: ${lesson?['videoUrl']}');
        print('📝 Is Quiz: ${lesson?['isQuiz']}');
        print('📍 Current index: $currentIndex of ${lessons.length}');
        if (currentIndex < lessons.length - 1) {
          print('➡️ Next will be: ${lessons[currentIndex + 1]['title']} (isQuiz: ${lessons[currentIndex + 1]['isQuiz']})');
        }
        
        // Initialize video player only if not a quiz and has video
        if (lesson?['isQuiz'] != true && lesson?['videoUrl'] != null) {
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

  Future<void> _submitQuiz() async {
    if (_lesson == null || _lesson!['quizQuestions'] == null) return;
    
    final questions = _lesson!['quizQuestions'] as List<dynamic>;
    int correct = 0;
    
    for (var q in questions) {
      final questionId = q['id'];
      final correctIndex = q['correctIndex'];
      if (_selectedAnswers[questionId] == correctIndex) {
        correct++;
      }
    }
    
    final score = {
      'correct': correct,
      'total': questions.length,
    };
    
    setState(() {
      _quizSubmitted = true;
      _quizScore = score;
    });
    
    // Save quiz result to database
    try {
      final user = await AuthService.getStoredUser();
      final userId = user?['id'] ?? '';
      
      if (userId.isNotEmpty) {
        final quizResult = {
          'pageId': _lesson!['id'],
          'answers': _selectedAnswers,
          'score': score,
          'submittedAt': DateTime.now().toIso8601String(),
        };
        
        await http.post(
          Uri.parse('https://millerstorm.tech/api/progress/save'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'userId': userId,
            'courseId': widget.courseId,
            'quizResult': quizResult,
          }),
        );
        
        print('💾 Quiz result saved to database');
      }
    } catch (e) {
      print('❌ Error saving quiz result: $e');
    }
    
    // Auto-advance after 2 seconds
    await Future.delayed(const Duration(seconds: 2));
    _markCompleteAndNext();
  }
  
  Future<void> _markCompleteAndNext() async {
    if (_lesson == null) return;
    
    try {
      final user = await AuthService.getStoredUser();
      final userId = user?['id'] ?? '';
      
      // Only mark lesson pages as complete (not quizzes)
      if (_lesson!['isQuiz'] != true) {
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
      }
      
      // Navigate to next lesson if available
      if (_currentLessonIndex < _allLessons.length - 1) {
        final nextLesson = _allLessons[_currentLessonIndex + 1];
        print('🔄 Navigating to next: ${nextLesson['title']} (isQuiz: ${nextLesson['isQuiz']})');
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
    // Don't show video section if no video URL
    if (_lesson?['videoUrl'] == null) {
      return const SizedBox.shrink();
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

  Widget _buildQuizContent() {
    if (_lesson?['quizQuestions'] == null) {
      return const SizedBox();
    }

    final questions = _lesson!['quizQuestions'] as List<dynamic>;
    
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
          // Score display (if submitted)
          if (_quizSubmitted && _quizScore != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: _quizScore!['correct'] == _quizScore!['total']
                    ? const Color(0xFFD1FAE5)
                    : const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Text(
                    'Score: ${_quizScore!['correct']}/${_quizScore!['total']}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: _textDark,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _quizScore!['correct'] == _quizScore!['total']
                        ? 'Perfect! 🎉'
                        : 'You got ${((_quizScore!['correct'] / _quizScore!['total']) * 100).round()}%',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF666666),
                    ),
                  ),
                ],
              ),
            ),
          
          // Questions
          ...questions.asMap().entries.map((entry) {
            final qIdx = entry.key;
            final q = entry.value;
            final questionId = q['id'];
            final options = q['options'] as List<dynamic>? ?? [];
            final correctIndex = q['correctIndex'];
            
            return Container(
              margin: const EdgeInsets.only(bottom: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Question ${qIdx + 1}: ${q['prompt']}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: _textDark,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Options
                  ...options.asMap().entries.map((optEntry) {
                    final optIdx = optEntry.key;
                    final option = optEntry.value;
                    final isSelected = _selectedAnswers[questionId] == optIdx;
                    final isCorrect = correctIndex == optIdx;
                    final showResult = _quizSubmitted;
                    
                    Color borderColor;
                    Color bgColor;
                    
                    if (showResult) {
                      if (isCorrect) {
                        borderColor = const Color(0xFF10B981);
                        bgColor = const Color(0xFFD1FAE5);
                      } else if (isSelected) {
                        borderColor = const Color(0xFFEF4444);
                        bgColor = const Color(0xFFFEE2E2);
                      } else {
                        borderColor = _border;
                        bgColor = _white;
                      }
                    } else {
                      borderColor = isSelected ? _primary : _border;
                      bgColor = isSelected ? const Color(0xFFEFF6FF) : _white;
                    }
                    
                    return GestureDetector(
                      onTap: _quizSubmitted ? null : () {
                        setState(() {
                          _selectedAnswers[questionId] = optIdx;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: bgColor,
                          border: Border.all(color: borderColor, width: 2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: showResult
                                      ? (isCorrect ? const Color(0xFF10B981) : isSelected ? const Color(0xFFEF4444) : _border)
                                      : (isSelected ? _primary : _border),
                                  width: 2,
                                ),
                                color: isSelected
                                    ? (showResult
                                        ? (isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                                        : _primary)
                                    : _white,
                              ),
                              child: isSelected
                                  ? const Center(
                                      child: Icon(
                                        Icons.circle,
                                        size: 8,
                                        color: _white,
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                option.toString(),
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: _textDark,
                                ),
                              ),
                            ),
                            if (showResult && isCorrect)
                              const Icon(
                                Icons.check,
                                color: Color(0xFF10B981),
                                size: 20,
                              ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ],
              ),
            );
          }).toList(),
        ],
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
                // Video Player (only if not quiz and has video)
                if (_lesson?['isQuiz'] != true && _lesson?['videoUrl'] != null)
                  _buildVideoPlayer(),
                
                // Content below video
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    child: Column(
                      children: [
                        // Quiz or Lesson content
                        if (_lesson?['isQuiz'] == true)
                          _buildQuizContent()
                        else
                          _buildLessonContent(),
                        
                        // Resources (only for lessons)
                        if (_lesson?['isQuiz'] != true)
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
                      
                      // Quiz submit or Next button
                      if (_lesson?['isQuiz'] == true && !_quizSubmitted)
                        GestureDetector(
                          onTap: () {
                            final questions = _lesson!['quizQuestions'] as List<dynamic>? ?? [];
                            if (_selectedAnswers.length == questions.length) {
                              _submitQuiz();
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            decoration: BoxDecoration(
                              color: _selectedAnswers.length == (_lesson!['quizQuestions'] as List<dynamic>? ?? []).length
                                  ? _primary
                                  : _border,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'Submit Quiz',
                              style: TextStyle(
                                color: _white,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        )
                      else if (_lesson?['isQuiz'] != true || _quizSubmitted)
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
