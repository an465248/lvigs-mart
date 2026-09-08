import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'phone_login_screen.dart';
import 'address_form_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _idToken;
  bool _tokenLoading = true;
  Map<String, dynamic>? _backendResponse;
  String? _backendError;
  List<BannerData> _banners = [];
  bool _bannersLoading = true;
  int _currentBannerIndex = 0;

  @override
  void initState() {
    super.initState();
    _fetchIdTokenAndLogin();
    _fetchBanners();
  }

  Future<void> _fetchIdTokenAndLogin() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      if (!mounted) return;
      setState(() {
        _idToken = null;
        _tokenLoading = false;
      });
      return;
    }

    try {
      final token = await user.getIdToken(true);
      if (!mounted) return;
      setState(() {
        _idToken = token;
        _tokenLoading = false;
      });

      _callNestBackend();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _idToken = 'Error: $e';
        _tokenLoading = false;
      });
    }
  }

  Future<void> _fetchBanners() async {
    try {
      final banners = await ApiService.getActiveBanners();
      if (!mounted) return;
      setState(() {
        _banners = banners;
        _bannersLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _bannersLoading = false;
      });
    }
  }

  Future<void> _callNestBackend() async {
    try {
      final response = await ApiService.firebaseLogin();
      if (!mounted) return;
      if (response != null) {
        setState(() => _backendResponse = response);
      } else {
        final signupResponse = await ApiService.firebaseSignup();
        if (!mounted) return;
        if (signupResponse != null) {
          setState(() => _backendResponse = signupResponse);
        } else {
          setState(() => _backendError = 'Backend login/signup failed');
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _backendError = 'Error: $e');
    }
  }

  void _openAddressForm() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const AddressFormScreen(
          title: 'Add Delivery Address',
        ),
      ),
    ).then((result) {
      if (result != null && mounted) {
        final data = result as Map<String, String>;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Address saved: ${data['city']}, ${data['state']} ${data['pincode']}'),
            backgroundColor: Colors.green,
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final AuthService authService = AuthService();
    final User? user = authService.currentUser;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        title: const Text('LVIGS Mart'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () async {
              await authService.signOut();
              if (context.mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const PhoneLoginScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner Carousel
            if (_bannersLoading)
              Container(
                height: 180,
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            else if (_banners.isNotEmpty)
              _BannerCarousel(
                banners: _banners,
                currentIndex: _currentBannerIndex,
                onPageChanged: (index) {
                  setState(() => _currentBannerIndex = index);
                },
              )
            else
              Container(
                height: 180,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [scheme.primary, scheme.primaryContainer],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_bag,
                          size: 48, color: scheme.onPrimary),
                      const SizedBox(height: 8),
                      Text(
                        'हर खरीदारी LVIGS Mart के साथ',
                        style: TextStyle(
                          color: scheme.onPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 24),

            // User Info
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Firebase',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[600])),
                    const SizedBox(height: 8),
                    _infoRow('Phone', user?.phoneNumber ?? 'N/A'),
                    const Divider(),
                    _infoRow('UID', user?.uid ?? 'N/A'),
                    const Divider(),
                    _infoRow('Token',
                        '${_idToken?.substring(0, 30) ?? '...'}...'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Backend Response
            Card(
              elevation: 1,
              color:
                  _backendError != null ? Colors.red[50] : Colors.green[50],
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('NestJS Backend',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[600])),
                    const SizedBox(height: 8),
                    if (_tokenLoading)
                      const CircularProgressIndicator(strokeWidth: 2)
                    else if (_backendError != null)
                      Text(_backendError!,
                          style: const TextStyle(color: Colors.red))
                    else if (_backendResponse != null) ...[
                      _infoRow('User ID',
                          _backendResponse!['user']?['id'] ?? 'N/A'),
                      const Divider(),
                      _infoRow('Role',
                          _backendResponse!['user']?['role'] ?? 'N/A'),
                      const Divider(),
                      _infoRow(
                          'Access Token',
                          '${(_backendResponse!['accessToken'] as String?)?.substring(0, 30) ?? '...'}...'),
                    ] else
                      const Text('Connecting...'),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Address Form Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _openAddressForm,
                icon: const Icon(Icons.location_on_outlined),
                label: const Text('Add Delivery Address'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: scheme.primary,
                  foregroundColor: scheme.onPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: TextStyle(
                color: Colors.grey[600], fontWeight: FontWeight.w500)),
        const SizedBox(width: 12),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _BannerCarousel extends StatefulWidget {
  final List<BannerData> banners;
  final int currentIndex;
  final ValueChanged<int> onPageChanged;

  const _BannerCarousel({
    required this.banners,
    required this.currentIndex,
    required this.onPageChanged,
  });

  @override
  State<_BannerCarousel> createState() => _BannerCarouselState();
}

class _BannerCarouselState extends State<_BannerCarousel> {
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: widget.currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        SizedBox(
          height: 180,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.banners.length,
            onPageChanged: widget.onPageChanged,
            itemBuilder: (context, index) {
              final banner = widget.banners[index];
              return GestureDetector(
                onTap: () {
                  // Navigate to CTA URL if available
                  if (banner.ctaUrlDisplay != '#') {
                    // TODO: Implement deep linking
                  }
                },
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: _parseColor(banner.bg) ?? scheme.primary,
                    borderRadius: BorderRadius.circular(16),
                    image: banner.displayImage.isNotEmpty
                        ? DecorationImage(
                            image: NetworkImage(banner.displayImage),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: LinearGradient(
                        colors: [
                          Colors.black.withOpacity(0.6),
                          Colors.transparent,
                        ],
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                      ),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (banner.subtitle != null &&
                            banner.subtitle!.isNotEmpty)
                          Text(
                            banner.subtitle!,
                            style: TextStyle(
                              color: _parseColor(banner.fg) ?? Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        const SizedBox(height: 4),
                        Text(
                          banner.title,
                          style: TextStyle(
                            color: _parseColor(banner.fg) ?? Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (banner.ctaTextDisplay.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '${banner.ctaTextDisplay} →',
                              style: TextStyle(
                                color:
                                    _parseColor(banner.fg) ?? Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.banners.length,
            (index) => Container(
              width: index == widget.currentIndex ? 24 : 8,
              height: 8,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: index == widget.currentIndex
                    ? scheme.primary
                    : scheme.primary.withOpacity(0.3),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Color? _parseColor(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    try {
      return Color(int.parse(hex, radix: 16));
    } catch (_) {
      return null;
    }
  }
}
