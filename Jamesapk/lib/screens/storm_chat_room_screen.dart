import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../services/auth_service.dart';
import 'storm_chat_group_info_screen.dart';
import 'image_viewer_screen.dart';
import 'package:url_launcher/url_launcher.dart';

class StormChatRoomScreen extends StatefulWidget {
  final dynamic group;
  final String userId;
  final String userRole;

  const StormChatRoomScreen({
    Key? key,
    required this.group,
    required this.userId,
    required this.userRole,
  }) : super(key: key);

  @override
  _StormChatRoomScreenState createState() => _StormChatRoomScreenState();
}

class _StormChatRoomScreenState extends State<StormChatRoomScreen> {
  List<dynamic> messages = [];
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool isLoading = true;
  bool isSending = false;
  bool isUploading = false;
  Timer? _pollTimer;
  String? userName;
  dynamic replyingTo; // Store the message being replied to
  String? _blinkingMessageId; // Track which message is blinking
  Timer? _blinkTimer;

  bool get canSendMessage {
    final onlyAdminCanChat = widget.group['onlyAdminCanChat'] ?? false;
    final members = List<String>.from(widget.group['members'] ?? []);
    final admins = List<String>.from(widget.group['admins'] ?? []);
    
    final isAdmin = widget.userRole == 'admin';
    final isGroupAdmin = admins.contains(widget.userId);
    final isGroupMember = members.contains(widget.userId);
    
    // If "Only admins can send messages" is checked, only system admins can send
    if (onlyAdminCanChat) {
      return isAdmin;
    }
    
    // If group admins are assigned, only group admins can send
    if (admins.isNotEmpty) {
      return isAdmin || isGroupAdmin;
    }
    
    // If no restrictions, all members can send
    return isAdmin || isGroupMember;
  }

  @override
  void initState() {
    super.initState();
    _loadUserName();
    _fetchMessages();
    _startPolling();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _blinkTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadUserName() async {
    final user = await AuthService.getStoredUser();
    if (user != null) {
      setState(() {
        userName = user['name'];
      });
      print('🔵 User loaded - Name: $userName');
    }
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _fetchMessages(silent: true);
    });
  }

  Future<void> _fetchMessages({bool silent = false}) async {
    try {
      final response = await http.get(
        Uri.parse('https://millerstorm.tech/api/storm-chat/messages/${widget.group['_id']}?userId=${widget.userId}&userRole=${widget.userRole}'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        
        // Log messages to check reply data
        if (!silent) {
          print('🔵 Fetched ${data.length} messages');
          for (var msg in data) {
            if (msg['replyTo'] != null) {
              print('🔵 Message with reply: ${msg['message']}');
              print('🔵   replyTo: ${msg['replyTo']}');
              print('🔵   replyToMessage: ${msg['replyToMessage']}');
              print('🔵   replyToSender: ${msg['replyToSender']}');
            }
          }
        }
        
        setState(() {
          messages = data;
          if (!silent) isLoading = false;
        });
        
        // Always scroll to bottom after fetching messages
        _scrollToBottom();
      } else if (response.statusCode == 403) {
        final error = json.decode(response.body);
        _showError(error['error'] ?? 'Access denied');
        if (!silent) {
          setState(() {
            isLoading = false;
          });
        }
      }
    } catch (e) {
      print('❌ Error fetching messages: $e');
      if (!silent) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  void _scrollToMessage(String messageId) {
    // Find the index of the message
    final index = messages.indexWhere((msg) => msg['_id'] == messageId);
    if (index == -1) return;

    // Calculate approximate position
    // Each message is roughly 80-100px, use 90 as average
    final position = index * 90.0;
    
    // Scroll to the message
    _scrollController.animateTo(
      position,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
    ).then((_) {
      // Start blinking animation
      setState(() {
        _blinkingMessageId = messageId;
      });
      
      // Stop blinking after 2 blinks (1 second)
      _blinkTimer?.cancel();
      _blinkTimer = Timer(const Duration(milliseconds: 1000), () {
        setState(() {
          _blinkingMessageId = null;
        });
      });
    });
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty || isSending) return;

    final message = _messageController.text.trim();
    final replyData = replyingTo; // Store reply data before clearing
    _messageController.clear();

    setState(() {
      isSending = true;
      replyingTo = null; // Clear reply preview immediately
    });

    try {
      final body = {
        'senderId': widget.userId,
        'senderName': userName,
        'senderRole': widget.userRole,
        'message': message,
        'messageType': 'text',
      };

      // Add reply information if replying to a message
      if (replyData != null) {
        body['replyTo'] = replyData['_id'];
        body['replyToMessage'] = replyData['message'];
        body['replyToSender'] = replyData['senderName'];
        print('🔵 Sending reply to: ${replyData['_id']}');
        print('🔵 Reply to message: ${replyData['message']}');
        print('🔵 Reply to sender: ${replyData['senderName']}');
      }

      print('🔵 Sending message body: ${json.encode(body)}');

      final response = await http.post(
        Uri.parse('https://millerstorm.tech/api/storm-chat/messages/${widget.group['_id']}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );

      print('🔵 Send message response: ${response.statusCode}');
      print('🔵 Send message response body: ${response.body}');

      if (response.statusCode == 201) {
        await _fetchMessages();
      } else {
        final error = json.decode(response.body);
        _showError(error['error'] ?? 'Failed to send message');
      }
    } catch (e) {
      print('❌ Error sending message: $e');
      _showError('Failed to send message');
    } finally {
      setState(() {
        isSending = false;
      });
    }
  }

  Future<void> _pickAndUploadMedia() async {
    final ImagePicker picker = ImagePicker();
    
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library, color: Color(0xFFDC2626)),
              title: const Text('Choose from Gallery'),
              onTap: () async {
                Navigator.pop(context);
                final XFile? image = await picker.pickImage(source: ImageSource.gallery);
                if (image != null) {
                  _uploadFile(File(image.path), 'image');
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Color(0xFFDC2626)),
              title: const Text('Take Photo'),
              onTap: () async {
                Navigator.pop(context);
                final XFile? image = await picker.pickImage(source: ImageSource.camera);
                if (image != null) {
                  _uploadFile(File(image.path), 'image');
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.videocam, color: Color(0xFFDC2626)),
              title: const Text('Choose Video'),
              onTap: () async {
                Navigator.pop(context);
                final XFile? video = await picker.pickVideo(source: ImageSource.gallery);
                if (video != null) {
                  _uploadFile(File(video.path), 'video');
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _uploadFile(File file, String type) async {
    setState(() {
      isUploading = true;
    });

    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('https://millerstorm.tech/api/upload-image'),
      );
      request.files.add(await http.MultipartFile.fromPath('file', file.path));

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final url = data['url'];

        // Send message with media
        await http.post(
          Uri.parse('https://millerstorm.tech/api/storm-chat/messages/${widget.group['_id']}'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({
            'senderId': widget.userId,
            'senderName': userName,
            'senderRole': widget.userRole,
            'message': file.path.split('/').last,
            'messageType': type,
            'mediaUrl': url,
          }),
        );

        await _fetchMessages();
      } else {
        _showError('Failed to upload file');
      }
    } catch (e) {
      print('Error uploading file: $e');
      _showError('Failed to upload file');
    } finally {
      setState(() {
        isUploading = false;
      });
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFFDC2626),
      ),
    );
  }

  String _formatTime(String dateStr) {
    // Parse the date string and convert to CT (UTC-5:00 for CDT)
    final date = DateTime.parse(dateStr);
    // Convert to UTC first, then subtract 5 hours for CDT (Central Daylight Time)
    final ctDate = date.toUtc().subtract(const Duration(hours: 5));
    final hour = ctDate.hour.toString().padLeft(2, '0');
    final minute = ctDate.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  String _formatDate(String dateStr) {
    // Parse the date string and convert to CT (UTC-5:00 for CDT)
    final date = DateTime.parse(dateStr);
    // Convert to UTC first, then subtract 5 hours for CDT (Central Daylight Time)
    final ctDate = date.toUtc().subtract(const Duration(hours: 5));
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final messageDate = DateTime(ctDate.year, ctDate.month, ctDate.day);

    if (messageDate == today) return 'Today';
    if (messageDate == yesterday) return 'Yesterday';
    
    return '${ctDate.day}/${ctDate.month}/${ctDate.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: const Color(0xFFDC2626),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => StormChatGroupInfoScreen(
                  group: widget.group,
                  userId: widget.userId,
                  userRole: widget.userRole,
                ),
              ),
            );
          },
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(8),
                  image: widget.group['imageUrl'] != null && widget.group['imageUrl'].isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage('https://millerstorm.tech${widget.group['imageUrl']}'),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: widget.group['imageUrl'] == null || widget.group['imageUrl'].isEmpty
                    ? const Center(
                        child: Text('👥', style: TextStyle(fontSize: 18)),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.group['name'] ?? 'Group',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${(widget.group['members'] as List?)?.length ?? 0} members',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFDC2626)),
                  )
                : messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                              'No messages yet',
                              style: TextStyle(fontSize: 16, color: Colors.grey),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Start the conversation!',
                              style: TextStyle(fontSize: 14, color: Colors.grey),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          return _buildMessage(messages[index], index);
                        },
                      ),
          ),
          
          // Input
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              children: [
                // Reply preview
                if (replyingTo != null)
                  Container(
                    padding: const EdgeInsets.all(8),
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(8),
                      border: Border(
                        left: BorderSide(
                          color: const Color(0xFFDC2626),
                          width: 3,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                replyingTo['senderName'] ?? 'Unknown',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFFDC2626),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                replyingTo['message'] ?? '',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF6B7280),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () {
                            setState(() {
                              replyingTo = null;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                !canSendMessage
                    ? Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          widget.group['onlyAdminCanChat'] == true
                              ? '🔒 Only admins can send messages\nMembers can only read messages'
                              : (widget.group['admins'] as List?)?.isNotEmpty == true
                                  ? '🔒 Only group admins can send messages\nMembers can only read messages'
                                  : '🔒 You cannot send messages in this group',
                          style: const TextStyle(
                            color: Color(0xFFDC2626),
                            fontSize: 14,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      )
                    : Row(
                        children: [
                          IconButton(
                            icon: Icon(
                              isUploading ? Icons.hourglass_empty : Icons.attach_file,
                              color: const Color(0xFFDC2626),
                            ),
                            onPressed: isUploading ? null : _pickAndUploadMedia,
                          ),
                          Expanded(
                            child: TextField(
                              controller: _messageController,
                              decoration: InputDecoration(
                                hintText: 'Type a message...',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(24),
                                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(24),
                                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(24),
                                  borderSide: const BorderSide(color: Color(0xFFDC2626)),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                              ),
                              maxLines: null,
                              textInputAction: TextInputAction.send,
                              onSubmitted: (_) => _sendMessage(),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            decoration: const BoxDecoration(
                              color: Color(0xFFDC2626),
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: Icon(
                                isSending ? Icons.hourglass_empty : Icons.send,
                                color: Colors.white,
                                size: 20,
                              ),
                              onPressed: isSending ? null : _sendMessage,
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

  Widget _buildMessage(dynamic message, int index) {
    final isMyMessage = message['senderId'] == widget.userId;
    final showDate = index == 0 ||
        _formatDate(messages[index - 1]['createdAt']) != _formatDate(message['createdAt']);
    final isBlinking = _blinkingMessageId == message['_id'];

    return Column(
      children: [
        if (showDate)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _formatDate(message['createdAt']),
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                ),
              ),
            ),
          ),
        // Swipeable message with animation
        _SwipeableMessage(
          onSwipeRight: () {
            setState(() {
              replyingTo = message;
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            decoration: BoxDecoration(
              color: isBlinking ? Colors.yellow.withOpacity(0.3) : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Align(
              alignment: isMyMessage ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.7,
                ),
                margin: const EdgeInsets.only(bottom: 8),
                child: Column(
                  crossAxisAlignment: isMyMessage ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    if (!isMyMessage)
                      Padding(
                        padding: const EdgeInsets.only(left: 8, bottom: 4),
                        child: Text(
                          message['senderName'] ?? 'Unknown',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ),
                    // Different styling for different message types
                    if (message['messageType'] == 'text')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isMyMessage ? const Color(0xFFDC2626) : const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(16),
                            topRight: const Radius.circular(16),
                            bottomLeft: Radius.circular(isMyMessage ? 16 : 4),
                            bottomRight: Radius.circular(isMyMessage ? 4 : 16),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Show reply preview inside the bubble
                            if (message['replyTo'] != null && 
                                message['replyTo'].toString().isNotEmpty &&
                                message['replyToMessage'] != null &&
                                message['replyToMessage'].toString().isNotEmpty)
                              GestureDetector(
                                onTap: () {
                                  _scrollToMessage(message['replyTo']);
                                },
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: isMyMessage
                                        ? Colors.white.withOpacity(0.2)
                                        : Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border(
                                      left: BorderSide(
                                        color: isMyMessage ? Colors.white : const Color(0xFFDC2626),
                                        width: 3,
                                      ),
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        message['replyToSender'] ?? 'Unknown',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: isMyMessage ? Colors.white : const Color(0xFFDC2626),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        message['replyToMessage'] ?? '',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: isMyMessage
                                              ? Colors.white.withOpacity(0.8)
                                              : const Color(0xFF6B7280),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            _buildMessageContent(message, isMyMessage),
                          ],
                        ),
                      )
                    else
                      // No background for images/videos
                      _buildMessageContent(message, isMyMessage),
                    Padding(
                      padding: EdgeInsets.only(
                        left: isMyMessage ? 0 : 8,
                        right: isMyMessage ? 8 : 0,
                        top: 4,
                      ),
                      child: Text(
                        _formatTime(message['createdAt']),
                        style: const TextStyle(
                          fontSize: 10,
                          color: Color(0xFF9CA3AF),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMessageContent(dynamic message, bool isMyMessage) {
    final messageType = message['messageType'] ?? 'text';
    final textColor = isMyMessage ? Colors.white : const Color(0xFF111827);

    if (messageType == 'text') {
      return _buildTextWithLinks(message['message'] ?? '', textColor);
    } else if (messageType == 'image' && message['mediaUrl'] != null) {
      return GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ImageViewerScreen(
                imageUrl: message['mediaUrl'],
              ),
            ),
          );
        },
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            'https://millerstorm.tech${message['mediaUrl']}',
            width: 200,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                width: 200,
                height: 150,
                color: Colors.grey[300],
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.broken_image, size: 48, color: Colors.grey[600]),
                    const SizedBox(height: 8),
                    Text(
                      'Image failed to load',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      );
    } else if (messageType == 'video' && message['mediaUrl'] != null) {
      return Container(
        width: 200,
        height: 150,
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Center(
          child: Icon(Icons.play_circle_outline, size: 48, color: Colors.white),
        ),
      );
    }

    return Text(
      message['message'] ?? '',
      style: TextStyle(fontSize: 14, color: textColor),
    );
  }

  Widget _buildTextWithLinks(String text, Color textColor) {
    final RegExp urlRegExp = RegExp(
      r'https?://[^\s]+',
      caseSensitive: false,
    );

    final List<TextSpan> spans = [];
    int start = 0;

    for (final Match match in urlRegExp.allMatches(text)) {
      // Add text before the URL
      if (match.start > start) {
        spans.add(TextSpan(
          text: text.substring(start, match.start),
          style: TextStyle(fontSize: 14, color: textColor),
        ));
      }

      // Add the clickable URL
      final String url = match.group(0)!;
      spans.add(TextSpan(
        text: url,
        style: TextStyle(
          fontSize: 14,
          color: textColor == Colors.white ? Colors.lightBlueAccent : Colors.blue,
          decoration: TextDecoration.underline,
        ),
        recognizer: TapGestureRecognizer()
          ..onTap = () async {
            try {
              final Uri uri = Uri.parse(url);
              // Try to launch with external application first
              bool launched = false;
              
              // Try external application mode
              if (await canLaunchUrl(uri)) {
                launched = await launchUrl(
                  uri,
                  mode: LaunchMode.externalApplication,
                );
              }
              
              // If external app fails, try platform default
              if (!launched && await canLaunchUrl(uri)) {
                launched = await launchUrl(
                  uri,
                  mode: LaunchMode.platformDefault,
                );
              }
              
              // If still not launched, show error
              if (!launched) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Could not launch $url'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            } catch (e) {
              print('Error launching URL: $e');
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error: ${e.toString()}'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            }
          },
      ));

      start = match.end;
    }

    // Add remaining text after the last URL
    if (start < text.length) {
      spans.add(TextSpan(
        text: text.substring(start),
        style: TextStyle(fontSize: 14, color: textColor),
      ));
    }

    return RichText(
      text: TextSpan(children: spans),
    );
  }
}

// Swipeable Message Widget with smooth animation
class _SwipeableMessage extends StatefulWidget {
  final Widget child;
  final VoidCallback onSwipeRight;

  const _SwipeableMessage({
    required this.child,
    required this.onSwipeRight,
  });

  @override
  State<_SwipeableMessage> createState() => _SwipeableMessageState();
}

class _SwipeableMessageState extends State<_SwipeableMessage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _animation;
  double _dragExtent = 0;
  bool _dragUnderway = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _animation = Tween<Offset>(
      begin: Offset.zero,
      end: Offset.zero,
    ).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleDragStart(DragStartDetails details) {
    _dragUnderway = true;
    _controller.stop();
  }

  void _handleDragUpdate(DragUpdateDetails details) {
    if (!_dragUnderway) return;

    final delta = details.primaryDelta!;
    _dragExtent += delta;

    // Only allow swipe to right and limit to 80px
    if (_dragExtent > 0) {
      setState(() {
        _dragExtent = _dragExtent.clamp(0.0, 80.0);
      });
    } else {
      _dragExtent = 0;
    }
  }

  void _handleDragEnd(DragEndDetails details) {
    if (!_dragUnderway) return;
    _dragUnderway = false;

    // If swiped more than 60px, trigger reply
    if (_dragExtent > 60) {
      widget.onSwipeRight();
    }

    // Animate back to original position
    _controller.reset();
    setState(() {
      _dragExtent = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onHorizontalDragStart: _handleDragStart,
      onHorizontalDragUpdate: _handleDragUpdate,
      onHorizontalDragEnd: _handleDragEnd,
      child: Stack(
        children: [
          // Reply icon that appears when swiping
          if (_dragExtent > 0)
            Positioned(
              left: 10,
              top: 0,
              bottom: 0,
              child: Center(
                child: Opacity(
                  opacity: (_dragExtent / 80).clamp(0.0, 1.0),
                  child: Icon(
                    Icons.reply,
                    color: Colors.grey[600],
                    size: 24,
                  ),
                ),
              ),
            ),
          // Message that moves
          Transform.translate(
            offset: Offset(_dragExtent, 0),
            child: widget.child,
          ),
        ],
      ),
    );
  }
}
