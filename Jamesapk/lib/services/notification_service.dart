import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';

class Notification {
  final String id;
  final String userId;
  final String type;
  final String title;
  final String message;
  final bool read;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  Notification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    required this.read,
    this.metadata,
    required this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      read: json['read'] as bool,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'type': type,
      'title': title,
      'message': message,
      'read': read,
      'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class NotificationService {
  static const String baseUrl = 'https://millerstorm.tech/api';

  // Replace with your OneSignal App ID (you'll get this from OneSignal dashboard)
  static const String oneSignalAppId = 'YOUR_ONESIGNAL_APP_ID';

  static Future<void> initOneSignal() async {
    // Initialize OneSignal
    OneSignal.Debug.setLogLevel(OSLogLevel.verbose);
    OneSignal.initialize(oneSignalAppId);

    // Request permission for push notifications
    OneSignal.Notifications.requestPermission(true);

    // Handle notification opened
    OneSignal.Notifications.addClickListener((event) {
      print('NOTIFICATION CLICKED: ${event.notification.jsonRepresentation()}');
      // TODO: Handle notification tap to navigate to chat
    });

    // Handle notification received
    OneSignal.Notifications.addForegroundWillDisplayListener((event) {
      print('NOTIFICATION RECEIVED IN FOREGROUND: ${event.notification.jsonRepresentation()}');
      // Optionally prevent auto-display to show custom in-app notification
      // event.preventDefault();
    });

    // Send device token to backend
    await _sendDeviceTokenToBackend();
  }

  static Future<void> _sendDeviceTokenToBackend() async {
    try {
      final tokenState = await OneSignal.User.getOnesignalId();
      if (tokenState != null) {
        final prefs = await SharedPreferences.getInstance();
        final savedToken = prefs.getString('onesignal_token');
        
        if (savedToken != tokenState) {
          // Save to shared preferences
          await prefs.setString('onesignal_token', tokenState);
          
          // You can also send this to your backend to associate with user
          // For now, we'll just save locally
          print('OneSignal Token saved: $tokenState');
        }
      }
    } catch (e) {
      print('Error sending OneSignal token: $e');
    }
  }

  static Future<List<Notification>> fetchNotifications(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/notifications?userId=$userId'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Notification.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }

  static Future<void> markAsRead(String id) async {
    try {
      await http.put(
        Uri.parse('$baseUrl/notifications'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'id': id}),
      );
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  static Future<void> saveDeviceToken(String token) async {
    // Legacy method - we use OneSignal now
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('deviceToken', token);
  }
}