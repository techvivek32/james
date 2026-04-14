import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../services/auth_service.dart';
import 'storm_chat_group_info_screen.dart';
import 'image_viewer_screen.dart';

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

  bool get canSendMessage {
    final onlyAdminCanChat = widget.group['onlyAdminCanChat'] ?? false;
    final members = List<String>.from(widget.group['members'] ?? []);
    final admins = List<String>.from(widget.group['admins'] ?? []);
    
    final isAdmin = widget.userRole == 'admin';
    final isGroupAdmin = admins.contains(widget.userId);
    final isGroupMember = members.contains(widget.userId);
    
    // Admins can always send, or group admins, or members if not restricted
    return isAdmin || isGroupAdmin || (onlyAdminCanChat ? false : isGroupMember);
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
        setState(() {
          messages = data;
          if (!silent) isLoading = false;
        });
        
        if (!silent) {
          _scrollToBottom();
        }
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
      print('Error fetching messages: $e');
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

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty || isSending) return;

    final message = _messageController.text.trim();
    _messageController.clear();

    setState(() {
      isSending = true;
    });

    try {
      final response = await http.post(
        Uri.parse('https://millerstorm.tech/api/storm-chat/messages/${widget.group['_id']}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'senderId': widget.userId,
          'senderName': userName,
          'senderRole': widget.userRole,
          'message': message,
          'messageType': 'text',
        }),
      );

      if (response.statusCode == 201) {
        await _fetchMessages();
      } else {
        final error = json.decode(response.body);
        _showError(error['error'] ?? 'Failed to send message');
      }
    } catch (e) {
      print('Error sending message: $e');
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
    final date = DateTime.parse(dateStr);
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final messageDate = DateTime(date.year, date.month, date.day);

    if (messageDate == today) return 'Today';
    if (messageDate == yesterday) return 'Yesterday';
    
    return '${date.day}/${date.month}/${date.year}';
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
            child: !canSendMessage
                ? Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      '🔒 Only admins can send messages in this group',
                      style: TextStyle(
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
          ),
        ],
      ),
    );
  }

  Widget _buildMessage(dynamic message, int index) {
    final isMyMessage = message['senderId'] == widget.userId;
    final showDate = index == 0 ||
        _formatDate(messages[index - 1]['createdAt']) != _formatDate(message['createdAt']);

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
        Align(
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
                    child: _buildMessageContent(message, isMyMessage),
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
      ],
    );
  }

  Widget _buildMessageContent(dynamic message, bool isMyMessage) {
    final messageType = message['messageType'] ?? 'text';
    final textColor = isMyMessage ? Colors.white : const Color(0xFF111827);

    if (messageType == 'text') {
      return Text(
        message['message'] ?? '',
        style: TextStyle(
          fontSize: 14,
          color: textColor,
        ),
      );
    } else if (messageType == 'image' && message['mediaUrl'] != null) {
      return GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ImageViewerScreen(
                imageUrl: message['mediaUrl'],
                fileName: message['message'],
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
}
