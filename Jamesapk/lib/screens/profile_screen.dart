import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const _bg = Color(0xFFF3F4F6);
  static const _white = Color(0xFFFFFFFF);
  static const _primary = Color(0xFFCB0002);
  static const _textDark = Color(0xFF111827);
  static const _textLight = Color(0xFF6B7280);
  static const _border = Color(0xFFD1D5DB);

  String _userName = 'User';
  String _userEmail = '';
  String _userRole = 'Sales Rep';
  String _userPhone = '';
  List<String> _userTerritories = [];
  String _userStrengths = '';
  String _userWeaknesses = '';
  String _userHeadshotUrl = '';
  String? _userId;
  bool _isEditMode = false;
  bool _isSaving = false;
  bool _isUploadingImage = false;

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _strengthsController = TextEditingController();
  final _weaknessesController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  final List<String> _availableTerritories = [
    'DFW, Texas',
    'Lubbock, Texas',
    'Round Rock, Texas',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _strengthsController.dispose();
    _weaknessesController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr != null) {
        final user = jsonDecode(userStr);
        setState(() {
          _userId = user['id'] ?? user['_id'];
          _userName = user['name'] ?? 'User';
          _userEmail = user['email'] ?? '';
          _userRole = user['role'] ?? 'Sales Rep';
          _userPhone = user['phone'] ?? '';
          
          // Handle territories as array
          if (user['territories'] is List) {
            _userTerritories = List<String>.from(user['territories']);
          } else if (user['territory'] != null && user['territory'].toString().isNotEmpty) {
            _userTerritories = [user['territory'].toString()];
          } else {
            _userTerritories = [];
          }
          
          _userStrengths = user['strengths'] ?? '';
          _userWeaknesses = user['weaknesses'] ?? '';
          _userHeadshotUrl = user['headshotUrl'] ?? '';
        });
      }
    } catch (e) {
      print('Error loading user data: $e');
    }
  }

  void _enterEditMode() {
    setState(() {
      _isEditMode = true;
      _nameController.text = _userName;
      _phoneController.text = _userPhone;
      _strengthsController.text = _userStrengths;
      _weaknessesController.text = _userWeaknesses;
    });
  }

  void _cancelEdit() {
    setState(() {
      _isEditMode = false;
    });
  }

  Future<void> _pickAndUploadImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (image == null) return;

      setState(() {
        _isUploadingImage = true;
      });

      final request = http.MultipartRequest(
        'POST',
        Uri.parse('https://millerstorm.tech/api/upload-image'),
      );

      request.files.add(
        await http.MultipartFile.fromPath('file', image.path),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      print('Upload response status: ${response.statusCode}');
      print('Upload response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final imageUrl = data['url'];

        // Update user profile with new headshot
        final updateResponse = await http.put(
          Uri.parse('https://millerstorm.tech/api/users/$_userId'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'headshotUrl': imageUrl}),
        );

        print('Update user response status: ${updateResponse.statusCode}');
        print('Update user response body: ${updateResponse.body}');

        if (updateResponse.statusCode == 200) {
          final updatedUser = jsonDecode(updateResponse.body);
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user', jsonEncode(updatedUser));

          setState(() {
            _userHeadshotUrl = imageUrl;
          });

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Profile image updated successfully'),
                backgroundColor: Color(0xFFCB0002),
              ),
            );
          }
        } else {
          throw Exception('Failed to update user profile: ${updateResponse.statusCode}');
        }
      } else {
        throw Exception('Failed to upload image: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('Error uploading image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upload image: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      setState(() {
        _isUploadingImage = false;
      });
    }
  }

  Future<void> _saveProfile() async {
    setState(() {
      _isSaving = true;
    });

    try {
      print('Saving profile for user ID: $_userId');
      final response = await http.put(
        Uri.parse('https://millerstorm.tech/api/users/$_userId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': _nameController.text,
          'phone': _phoneController.text,
          'territories': _userTerritories,
          'strengths': _strengthsController.text,
          'weaknesses': _weaknessesController.text,
        }),
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final updatedUser = jsonDecode(response.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user', jsonEncode(updatedUser));

        setState(() {
          _userName = updatedUser['name'] ?? _userName;
          _userPhone = updatedUser['phone'] ?? '';
          if (updatedUser['territories'] is List) {
            _userTerritories = List<String>.from(updatedUser['territories']);
          }
          _userStrengths = updatedUser['strengths'] ?? '';
          _userWeaknesses = updatedUser['weaknesses'] ?? '';
          _isEditMode = false;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile updated successfully'),
              backgroundColor: Color(0xFFCB0002),
            ),
          );
        }
      } else {
        throw Exception('Failed to update profile: ${response.statusCode}');
      }
    } catch (e) {
      print('Error saving profile: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  Future<void> _logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/login');
      }
    } catch (e) {
      print('Error logging out: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _primary,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: _white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          _isEditMode ? 'Edit Profile' : 'Profile',
          style: const TextStyle(
            color: _white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: _isEditMode
            ? [
                TextButton(
                  onPressed: _isSaving ? null : _cancelEdit,
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: _white, fontSize: 16),
                  ),
                ),
              ]
            : null,
      ),
      body: _isEditMode ? _buildEditMode() : _buildViewMode(),
    );
  }

  Widget _buildViewMode() {
    return SingleChildScrollView(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            color: _primary,
            padding: const EdgeInsets.only(bottom: 40),
            child: Column(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: _white.withOpacity(0.2),
                      backgroundImage: _userHeadshotUrl.isNotEmpty
                          ? NetworkImage('https://millerstorm.tech$_userHeadshotUrl')
                          : null,
                      child: _userHeadshotUrl.isEmpty
                          ? Icon(Icons.person, color: _white, size: 50)
                          : null,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: _isUploadingImage ? null : _pickAndUploadImage,
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: _white,
                            shape: BoxShape.circle,
                            border: Border.all(color: _primary, width: 2),
                          ),
                          child: _isUploadingImage
                              ? Padding(
                                  padding: const EdgeInsets.all(8),
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: _primary,
                                  ),
                                )
                              : Icon(Icons.camera_alt, color: _primary, size: 18),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  _userName,
                  style: const TextStyle(
                    color: _white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _userEmail,
                  style: TextStyle(
                    color: _white.withOpacity(0.9),
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: _white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _userRole.toUpperCase(),
                    style: const TextStyle(
                      color: _white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _buildMenuItem(
                  icon: Icons.person_outline,
                  title: 'Edit Profile',
                  onTap: _enterEditMode,
                ),
                const SizedBox(height: 12),
                _buildMenuItem(
                  icon: Icons.notifications_outlined,
                  title: 'Notifications',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Coming Soon'),
                        backgroundColor: Color(0xFFCB0002),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                _buildMenuItem(
                  icon: Icons.help_outline,
                  title: 'Help & Support',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Coming Soon'),
                        backgroundColor: Color(0xFFCB0002),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _logout,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.logout, color: _white, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Logout',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: _white,
                          ),
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

  Widget _buildEditMode() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTextField(
            label: 'Full Name',
            controller: _nameController,
            icon: Icons.person_outline,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            label: 'Email',
            controller: TextEditingController(text: _userEmail),
            icon: Icons.email_outlined,
            enabled: false,
            helperText: 'Email cannot be changed',
          ),
          const SizedBox(height: 16),
          _buildTextField(
            label: 'Phone',
            controller: _phoneController,
            icon: Icons.phone_outlined,
            hint: 'Your mobile number',
          ),
          const SizedBox(height: 16),
          _buildTerritoryField(),
          const SizedBox(height: 16),
          _buildTextField(
            label: 'Strengths / Superpowers',
            controller: _strengthsController,
            icon: Icons.star_outline,
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            label: 'Weaknesses / Insecurities',
            controller: _weaknessesController,
            icon: Icons.warning_amber_outlined,
            maxLines: 3,
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _saveProfile,
              style: ElevatedButton.styleFrom(
                backgroundColor: _primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSaving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: _white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      'Save Changes',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: _white,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTerritoryField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Territory',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: _textDark,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: _white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _border),
          ),
          child: Column(
            children: _availableTerritories.map((territory) {
              final isSelected = _userTerritories.contains(territory);
              return CheckboxListTile(
                value: isSelected,
                onChanged: (bool? value) {
                  setState(() {
                    if (value == true) {
                      _userTerritories.add(territory);
                    } else {
                      _userTerritories.remove(territory);
                    }
                  });
                },
                title: Text(
                  territory,
                  style: const TextStyle(
                    fontSize: 16,
                    color: _textDark,
                  ),
                ),
                activeColor: _primary,
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    String? hint,
    String? helperText,
    bool enabled = true,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: _textDark,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          enabled: enabled,
          maxLines: maxLines,
          style: TextStyle(
            fontSize: 16,
            color: enabled ? _textDark : _textLight,
          ),
          decoration: InputDecoration(
            hintText: hint,
            helperText: helperText,
            helperStyle: const TextStyle(
              fontSize: 12,
              color: _textLight,
            ),
            prefixIcon: Icon(icon, color: enabled ? _textLight : _border),
            filled: true,
            fillColor: enabled ? _white : _bg,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _primary, width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _border),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _bg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: _textDark, size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: _textDark,
                ),
              ),
            ),
            Icon(Icons.chevron_right, color: _textLight, size: 24),
          ],
        ),
      ),
    );
  }
}
