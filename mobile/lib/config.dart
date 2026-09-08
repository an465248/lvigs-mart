/// Environment configuration for LVIGS Mart mobile app.
/// Change [baseUrl] for different environments.
/// Build with: flutter build apk --dart-define=API_BASE_URL=http://10.47.26.171:4000/api
class AppConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.47.26.171:4000/api',
  );

  static const Duration apiTimeout = Duration(seconds: 10);
  static const Duration longApiTimeout = Duration(seconds: 30);
}
