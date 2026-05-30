import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:open_file/open_file.dart';
import 'package:image_editor_plus/image_editor_plus.dart';

class ImageViewerScreen extends StatefulWidget {
  final String imageUrl;
  final String? fileName;

  const ImageViewerScreen({
    Key? key,
    required this.imageUrl,
    this.fileName,
  }) : super(key: key);

  @override
  State<ImageViewerScreen> createState() => _ImageViewerScreenState();
}

class _ImageViewerScreenState extends State<ImageViewerScreen> {
  final GlobalKey _shareButtonKey = GlobalKey();

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
          widget.fileName ?? 'Image',
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
        actions: [
          IconButton(
            key: _shareButtonKey,
            icon: const Icon(Icons.share, color: Colors.white),
            onPressed: () => _shareImage(context),
          ),
          IconButton(
            icon: const Icon(Icons.download, color: Colors.white),
            onPressed: () => _downloadImage(context),
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
            widget.imageUrl.startsWith('http') ? widget.imageUrl : 'https://millerstorm.tech${widget.imageUrl}',
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
      // Request storage permission
      if (Theme.of(context).platform == TargetPlatform.android) {
        final status = await Permission.storage.request();
        if (!status.isGranted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Storage permission required to download images'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Downloading image...'),
          backgroundColor: Colors.green,
        ),
      );

      final url = widget.imageUrl.startsWith('http') ? widget.imageUrl : 'https://millerstorm.tech${widget.imageUrl}';
      final response = await http.get(Uri.parse(url));
      final result = await ImageGallerySaver.saveImage(
        Uint8List.fromList(response.bodyBytes),
        quality: 100,
        name: 'StormChat_${DateTime.now().millisecondsSinceEpoch}',
      );
      
      if (result['isSuccess']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Image saved to Gallery'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to save image to Gallery'),
            backgroundColor: Colors.red,
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Preparing to share...'),
          backgroundColor: Colors.blue,
        ),
      );
      
      final url = widget.imageUrl.startsWith('http') ? widget.imageUrl : 'https://millerstorm.tech${widget.imageUrl}';
      print('Sharing image from URL: $url');
      
      // Download image temporarily for sharing
      final response = await http.get(Uri.parse(url));
      print('Response status: ${response.statusCode}');
      print('Response body length: ${response.bodyBytes.length}');
      
      if (response.statusCode == 200) {
        final tempDir = await getTemporaryDirectory();
        final fileName = 'share_image_${DateTime.now().millisecondsSinceEpoch}.jpg';
        final file = File('${tempDir.path}/$fileName');
        print('Writing to file: ${file.path}');
        await file.writeAsBytes(response.bodyBytes);
        print('File exists: ${await file.exists()}');
        print('File length: ${await file.length()}');
        
        // Get share position origin for iOS
        final RenderBox? box = _shareButtonKey.currentContext?.findRenderObject() as RenderBox?;
        final sharePositionOrigin = box == null
            ? null
            : box.localToGlobal(Offset.zero) & box.size;
        
        final result = await Share.shareXFiles(
          [XFile(file.path)],
          text: 'Shared from StormChat',
          sharePositionOrigin: sharePositionOrigin,
        );
        print('Share result: $result');
      }
    } catch (e, stackTrace) {
      print('Share error: $e');
      print('Stack trace: $stackTrace');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to share image: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _editImage(BuildContext context) async {
    try {
      final url = widget.imageUrl.startsWith('http') ? widget.imageUrl : 'https://millerstorm.tech${widget.imageUrl}';
      final response = await http.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        // Open image editor
        final editedImage = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ImageEditor(
              image: response.bodyBytes,
            ),
          ),
        );
        
        // If user saved the edited image
        if (editedImage != null) {
          // Save edited image to gallery
          final result = await ImageGallerySaver.saveImage(
            editedImage,
            quality: 100,
            name: 'StormChat_Edited_${DateTime.now().millisecondsSinceEpoch}',
          );
          
          if (result['isSuccess']) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Edited image saved to Gallery'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 3),
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Failed to save edited image'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      }
    } catch (e, stackTrace) {
      print('Edit error: $e');
      print('Stack trace: $stackTrace');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to edit image: ${e.toString()}'),
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
              leading: const Icon(Icons.edit, color: Colors.white),
              title: const Text('Edit', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _editImage(context);
              },
            ),
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
            Text('URL: ${widget.imageUrl}', style: const TextStyle(color: Colors.white70)),
            if (widget.fileName != null)
              Text('Name: ${widget.fileName}', style: const TextStyle(color: Colors.white70)),
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
