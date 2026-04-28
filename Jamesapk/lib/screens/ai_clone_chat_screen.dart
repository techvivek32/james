import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class AiCloneChatScreen extends StatefulWidget {
  final dynamic bot;

  const AiCloneChatScreen({Key? key, required this.bot}) : super(key: key);

  @override
  State<AiCloneChatScreen> createState() => _AiCloneChatScreenState();
}

class _AiCloneChatScreenState extends State<AiCloneChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Map<String, dynamic>> messages = [];
  bool isLoading = false;
  bool isSending = false;
  String? userId;
  String? userName;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _loadChatHistory();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr != null) {
        final user = jsonDecode(userStr);
        setState(() {
          userId = user['_id'] ?? user['id'];
          userName = user['name'] ?? 'User';
        });
      }
    } catch (e) {
      print('Error loading user data: $e');
    }
  }

  Future<void> _loadChatHistory() async {
    if (userId == null) return;

    setState(() {
      isLoading = true;
    });

    try {
      final response = await http.get(
        Uri.parse('https://millerstorm.tech/api/ai-chat/history/${widget.bot['_id']}/$userId'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        setState(() {
          messages = data.map((msg) => {
            'role': msg['role'],
            'content': msg['content'],
            'timestamp': msg['timestamp'],
          }).toList().cast<Map<String, dynamic>>();
          isLoading = false;
        });
        _scrollToBottom();
      } else {
        setState(() {
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading chat history: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty || isSending || userId == null) return;

    final userMessage = _messageController.text.trim();
    _messageController.clear();

    // Add user message to UI
    setState(() {
      messages.add({
        'role': 'user',
        'content': userMessage,
        'timestamp': DateTime.now().toIso8601String(),
      });
      isSending = true;
    });

    _scrollToBottom();

    try {
      final response = await http.post(
        Uri.parse('https://millerstorm.tech/api/ai-chat/message'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'botId': widget.bot['_id'],
          'userId': userId,
          'message': userMessage,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final botReply = data['reply'] ?? 'Sorry, I could not process your request.';

        setState(() {
          messages.add({
            'role': 'assistant',
            'content': botReply,
            'timestamp': DateTime.now().toIso8601String(),
          });
          isSending = false;
        });

        _scrollToBottom();
      } else {
        setState(() {
          messages.add({
            'role': 'assistant',
            'content': 'Sorry, something went wrong. Please try again.',
            'timestamp': DateTime.now().toIso8601String(),
          });
          isSending = false;
        });
      }
    } catch (e) {
      print('Error sending message: $e');
      setState(() {
        messages.add({
          'role': 'assistant',
          'content': 'Network error. Please check your connection.',
          'timestamp': DateTime.now().toIso8601String(),
        });
        isSending = false;
      });
    }
  }

  Future<void> _clearChat() async {
    if (userId == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Chat'),
        content: const Text('Are you sure you want to clear this chat history?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Clear',
              style: TextStyle(color: Color(0xFFCB0002)),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final response = await http.delete(
        Uri.parse('https://millerstorm.tech/api/ai-chat/history/${widget.bot['_id']}/$userId'),
      );

      if (response.statusCode == 200) {
        setState(() {
          messages.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Chat cleared successfully'),
            backgroundColor: Color(0xFF16A34A),
          ),
        );
      }
    } catch (e) {
      print('Error clearing chat: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to clear chat'),
          backgroundColor: Color(0xFFCB0002),
        ),
      );
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _formatTime(String timestamp) {
    try {
      final date = DateTime.parse(timestamp);
      final hour = date.hour.toString().padLeft(2, '0');
      final minute = date.minute.toString().padLeft(2, '0');
      return '$hour:$minute';
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final botName = widget.bot['name'] ?? 'AI Bot';
    final botImageUrl = widget.bot['imageUrl'] ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFFCB0002),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                image: botImageUrl.isNotEmpty
                    ? DecorationImage(
                        image: NetworkImage('https://millerstorm.tech$botImageUrl'),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: botImageUrl.isEmpty
                  ? const Icon(
                      Icons.smart_toy,
                      size: 20,
                      color: Color(0xFFCB0002),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                botName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.white),
            onPressed: _clearChat,
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFFCB0002),
                    ),
                  )
                : messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(16),
                                image: botImageUrl.isNotEmpty
                                    ? DecorationImage(
                                        image: NetworkImage('https://millerstorm.tech$botImageUrl'),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: botImageUrl.isEmpty
                                  ? const Icon(
                                      Icons.smart_toy,
                                      size: 40,
                                      color: Color(0xFFCB0002),
                                    )
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Chat with $botName',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF111827),
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Start a conversation!',
                              style: TextStyle(
                                fontSize: 14,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          return _buildMessage(messages[index]);
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
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: TextField(
                      controller: _messageController,
                      style: const TextStyle(
                        color: Color(0xFF111827),
                        fontSize: 16,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle: TextStyle(
                          color: Color(0xFF9CA3AF),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(24)),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                        filled: true,
                        fillColor: Color(0xFFF3F4F6),
                      ),
                      maxLines: null,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFFCB0002),
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

  Widget _buildMessage(Map<String, dynamic> message) {
    final isUser = message['role'] == 'user';
    final content = message['content'] ?? '';
    final timestamp = message['timestamp'] ?? '';

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        margin: const EdgeInsets.only(bottom: 12),
        child: Column(
          crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? const Color(0xFFCB0002) : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: Text(
                content,
                style: TextStyle(
                  fontSize: 15,
                  color: isUser ? Colors.white : const Color(0xFF111827),
                ),
              ),
            ),
            if (timestamp.isNotEmpty)
              Padding(
                padding: EdgeInsets.only(
                  left: isUser ? 0 : 8,
                  right: isUser ? 8 : 0,
                  top: 4,
                ),
                child: Text(
                  _formatTime(timestamp),
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
