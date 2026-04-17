import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class ImageViewerScreen extends StatelessWidget {
  final String imageUrl;
  final String? fileName;

  const ImageViewerScreen({
    Key? key,
    required this.imageUrl,
    this.fileName,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          fileName ?? 'Image',
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.download, color: Colors.white),
            onPressed: () => _downloadImage(context),
          ),
          IconButton(
            icon: const Icon(Icons.share, color: Colors.white),
            onPressed: () => _shareImage(context),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onPressed: () => _showMoreOptions(context),
          ),
        ],
      ),
      body: Center(
        child: InteractiveViewer(
          panEnabled: true,
          boundaryMargin: const EdgeInsets.all(20),
          minScale: 0.5,
          maxScale: 4.0,
          child: Image.network(
            imageUrl.startsWith('http') ? imageUrl : 'https://millerstorm.tech$imageUrl',
            fit: BoxFit.contain,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                      : null,
                ),
              );
            },
            errorBuilder: (context, error, stackTrace) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error, color: Colors.white, size: 64),
                    SizedBox(height: 16),
                    Text(
                      'Failed to load image',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _downloadImage(BuildContext context) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Downloading image...'),
          backgroundColor: Colors.green,
        ),
      );

      // Request storage permission based on Android version
      if (Platform.isAndroid) {
        // For Android 13+ (API 33+), we need photos permission
        // For Android 10-12, we need storage permission
        PermissionStatus status;
        
        // Try photos permission first (Android 13+)
        status = await Permission.photos.status;
        if (!status.isGranted) {
          status = await Permission.photos.request();
        }
        
        // If photos permission not available, try storage (Android 10-12)
        if (!status.isGranted) {
          status = await Permission.storage.status;
          if (!status.isGranted) {
            status = await Permission.storage.request();
          }
        }
        
        // If still not granted, try manageExternalStorage for Android 11+
        if (!status.isGranted) {
          status = await Permission.manageExternalStorage.status;
          if (!status.isGranted) {
            status = await Permission.manageExternalStorage.request();
          }
        }
        
        if (!status.isGranted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Storage permission required to download'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }
      }

      final url = imageUrl.startsWith('http') ? imageUrl : 'https://millerstorm.tech$imageUrl';
      final response = await http.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        Directory? directory;
        
        if (Platform.isAndroid) {
          // Try multiple paths for Android
          final paths = [
            '/storage/emulated/0/Download',
            '/storage/emulated/0/Downloads',
            '/sdcard/Download',
            '/sdcard/Downloads',
          ];
          
          for (final path in paths) {
            final dir = Directory(path);
            if (await dir.exists()) {
              directory = dir;
              break;
            }
          }
          
          // Fallback to external storage directory
          if (directory == null) {
            directory = await getExternalStorageDirectory();
          }
        } else {
          // Save to Documents on iOS
          directory = await getApplicationDocumentsDirectory();
        }
        
        final fileName = 'StormChat_${DateTime.now().millisecondsSinceEpoch}.jpg';
        final file = File('${directory!.path}/$fileName');
        
        await file.writeAsBytes(response.bodyBytes);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Image saved to ${Platform.isAndroid ? "Downloads" : "Documents"} folder'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
            action: SnackBarAction(
              label: 'OK',
              textColor: Colors.white,
              onPressed: () {},
            ),
          ),
        );
      }
    } catch (e) {
      print('Download error: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to download: ${e.toString()}'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  void _shareImage(BuildContext context) async {
    try {
      final url = imageUrl.startsWith('http') ? imageUrl : 'https://millerstorm.tech$imageUrl';
      
      // Show share options
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.grey[900],
        builder: (context) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Share Image',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.share, color: Colors.white),
                title: const Text('Share via Apps', style: TextStyle(color: Colors.white)),
                subtitle: const Text('WhatsApp, Telegram, etc.', style: TextStyle(color: Colors.white70)),
                onTap: () async {
                  Navigator.pop(context);
                  try {
                    // Download image temporarily for sharing
                    final response = await http.get(Uri.parse(url));
                    if (response.statusCode == 200) {
                      final tempDir = await getTemporaryDirectory();
                      final fileName = 'share_image_${DateTime.now().millisecondsSinceEpoch}.jpg';
                      final file = File('${tempDir.path}/$fileName');
                      await file.writeAsBytes(response.bodyBytes);
                      
                      await Share.shareXFiles(
                        [XFile(file.path)],
                        text: 'Shared from StormChat',
                      );
                    }
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Failed to share image'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.link, color: Colors.white),
                title: const Text('Copy Link', style: TextStyle(color: Colors.white)),
                subtitle: const Text('Copy image URL', style: TextStyle(color: Colors.white70)),
                onTap: () {
                  Navigator.pop(context);
                  Clipboard.setData(ClipboardData(text: url));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Image URL copied to clipboard'),
                      backgroundColor: Colors.green,
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to share image'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showMoreOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.share, color: Colors.white),
              title: const Text('Share', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _shareImage(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.download, color: Colors.white),
              title: const Text('Download', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _downloadImage(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.info, color: Colors.white),
              title: const Text('Image Info', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _showImageInfo(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showImageInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text('Image Info', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('URL: $imageUrl', style: const TextStyle(color: Colors.white70)),
            if (fileName != null)
              Text('Name: $fileName', style: const TextStyle(color: Colors.white70)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close', style: TextStyle(color: Colors.blue)),
          ),
        ],
      ),
    );
  }
}