import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import '../config.dart';

class ApiService {
  static const String baseUrl = AppConfig.baseUrl;

  static Future<Map<String, dynamic>?> firebaseLogin() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return null;

    final idToken = await user.getIdToken();

    final response = await http.post(
      Uri.parse('$baseUrl/auth/firebase/login'),
      headers: {
        'Authorization': 'Bearer $idToken',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      print('Firebase login failed: ${response.statusCode} ${response.body}');
      return null;
    }
  }

  static Future<Map<String, dynamic>?> firebaseSignup({
    String? name,
    String? email,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return null;

    final idToken = await user.getIdToken();

    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (email != null) body['email'] = email;

    final response = await http.post(
      Uri.parse('$baseUrl/auth/firebase/signup'),
      headers: {
        'Authorization': 'Bearer $idToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      print('Firebase signup failed: ${response.statusCode} ${response.body}');
      return null;
    }
  }

  /// Fetch active banners from the backend.
  static Future<List<BannerData>> getActiveBanners() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/banners/active'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) {
          return data.map((b) => BannerData.fromJson(b)).toList();
        }
        return [];
      } else {
        print('Banners failed: ${response.statusCode} ${response.body}');
        return [];
      }
    } catch (e) {
      print('Banners error: $e');
      return [];
    }
  }

  /// Lookup Indian PIN code to get city/district/state.
  static Future<PincodeLookupResult?> lookupPincode(String pincode) async {
    if (pincode.length != 6 || !RegExp(r'^[1-9]\d{5}$').hasMatch(pincode)) {
      return null;
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/location/pincode/$pincode'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return PincodeLookupResult.fromJson(data);
      } else {
        print('Pincode lookup failed: ${response.statusCode} ${response.body}');
        return null;
      }
    } catch (e) {
      print('Pincode lookup error: $e');
      return null;
    }
  }

  /// Get JWT access token for authenticated requests.
  static Future<String?> getAccessToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return null;
    return await user.getIdToken();
  }

  /// Get authenticated headers.
  static Future<Map<String, String>> _authHeaders() async {
    final token = await getAccessToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ========== Phase 6: AI Shopping Assistant ==========

  static Future<Map<String, dynamic>?> aiChat(String message, {String? sessionId}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/ai/chat'),
        headers: await _authHeaders(),
        body: jsonEncode({'message': message, 'sessionId': sessionId}),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('AI chat error: $e');
      return null;
    }
  }

  // ========== Phase 6: Voice Search ==========

  static Future<Map<String, dynamic>?> voiceSearch(String transcript, {String language = 'en'}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/search/voice'),
        headers: await _authHeaders(),
        body: jsonEncode({'transcript': transcript, 'language': language}),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Voice search error: $e');
      return null;
    }
  }

  // ========== Phase 6: Barcode Search ==========

  static Future<Map<String, dynamic>?> searchByBarcode(String barcode) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/products/barcode/$barcode'),
        headers: await _authHeaders(),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Barcode search error: $e');
      return null;
    }
  }

  // ========== Phase 6: Product Comparison ==========

  static Future<Map<String, dynamic>?> compareProducts(List<String> ids) async {
    try {
      final idsParam = ids.join(',');
      final response = await http.get(
        Uri.parse('$baseUrl/products/compare?ids=$idsParam'),
        headers: await _authHeaders(),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Compare products error: $e');
      return null;
    }
  }

  // ========== Phase 6: Loyalty ==========

  static Future<Map<String, dynamic>?> getLoyaltyAccount() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/loyalty/account'),
        headers: await _authHeaders(),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Loyalty account error: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>?> getLoyaltyTransactions({int page = 1, int limit = 20}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/loyalty/transactions?page=$page&limit=$limit'),
        headers: await _authHeaders(),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Loyalty transactions error: $e');
      return null;
    }
  }

  // ========== Phase 6: Referrals ==========

  static Future<Map<String, dynamic>?> getReferralCode() async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/referrals/code'),
        headers: await _authHeaders(),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Referral code error: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>?> getReferralStats() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/referrals/stats'),
        headers: await _authHeaders(),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('Referral stats error: $e');
      return null;
    }
  }

  // ========== Phase 6: Analytics ==========

  static Future<bool> trackEvent(String type, {Map<String, dynamic>? metadata}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/analytics/track'),
        headers: await _authHeaders(),
        body: jsonEncode({'type': type, 'metadata': metadata}),
      ).timeout(AppConfig.apiTimeout);

      return response.statusCode == 200;
    } catch (e) {
      print('Analytics track error: $e');
      return false;
    }
  }

  // ========== Phase 6: Search ==========

  static Future<List<dynamic>> search(String query, {int limit = 20}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/search?q=${Uri.encodeComponent(query)}&limit=$limit'),
        headers: await _authHeaders(),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) return data;
      }
      return [];
    } catch (e) {
      print('Search error: $e');
      return [];
    }
  }
}

/// Banner data model.
class BannerData {
  final String id;
  final String title;
  final String? subtitle;
  final String image;
  final String? mobileImage;
  final String? bg;
  final String? fg;
  final String? ctaLabel;
  final String? ctaLink;
  final String? ctaText;
  final String? ctaUrl;
  final String? link;
  final int sortOrder;
  final bool isActive;

  BannerData({
    required this.id,
    required this.title,
    this.subtitle,
    required this.image,
    this.mobileImage,
    this.bg,
    this.fg,
    this.ctaLabel,
    this.ctaLink,
    this.ctaText,
    this.ctaUrl,
    this.link,
    this.sortOrder = 0,
    this.isActive = true,
  });

  factory BannerData.fromJson(Map<String, dynamic> json) {
    return BannerData(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String?,
      image: json['image'] as String? ?? '',
      mobileImage: json['mobileImage'] as String?,
      bg: json['bg'] as String?,
      fg: json['fg'] as String?,
      ctaLabel: json['ctaLabel'] as String?,
      ctaLink: json['ctaLink'] as String?,
      ctaText: json['ctaText'] as String?,
      ctaUrl: json['ctaUrl'] as String?,
      link: json['link'] as String?,
      sortOrder: json['sortOrder'] as int? ?? json['position'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  String get displayImage => mobileImage?.isNotEmpty == true ? mobileImage! : image;
  String get ctaTextDisplay => ctaText ?? ctaLabel ?? '';
  String get ctaUrlDisplay => ctaUrl ?? ctaLink ?? link ?? '#';
}

/// Normalized PIN code lookup result.
class PincodeLookupResult {
  final String pincode;
  final String city;
  final String district;
  final String state;
  final String region;
  final List<PostOfficeItem> postOffices;

  PincodeLookupResult({
    required this.pincode,
    required this.city,
    required this.district,
    required this.state,
    required this.region,
    required this.postOffices,
  });

  factory PincodeLookupResult.fromJson(Map<String, dynamic> json) {
    return PincodeLookupResult(
      pincode: json['pincode'] as String? ?? '',
      city: json['city'] as String? ?? '',
      district: json['district'] as String? ?? '',
      state: json['state'] as String? ?? '',
      region: json['region'] as String? ?? '',
      postOffices: (json['postOffices'] as List<dynamic>?)
              ?.map((e) => PostOfficeItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  bool get hasMultipleAreas => postOffices.length > 1;
}

class PostOfficeItem {
  final String name;
  final String area;
  final String district;

  PostOfficeItem({
    required this.name,
    required this.area,
    required this.district,
  });

  factory PostOfficeItem.fromJson(Map<String, dynamic> json) {
    return PostOfficeItem(
      name: json['name'] as String? ?? '',
      area: json['area'] as String? ?? '',
      district: json['district'] as String? ?? '',
    );
  }
}
