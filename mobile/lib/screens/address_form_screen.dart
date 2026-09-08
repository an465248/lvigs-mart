import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

/// Address form screen with PIN code auto-location feature.
///
/// When user enters a valid 6-digit Indian PIN code, the form
/// automatically looks up city/district/state via the backend API
/// and populates the corresponding fields.
class AddressFormScreen extends StatefulWidget {
  final Map<String, String>? initialData;
  final String? title;

  const AddressFormScreen({
    super.key,
    this.initialData,
    this.title,
  });

  @override
  State<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends State<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _pincodeController = TextEditingController();
  final _cityController = TextEditingController();
  final _districtController = TextEditingController();
  final _stateController = TextEditingController();
  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _line1Controller = TextEditingController();
  final _line2Controller = TextEditingController();
  final _landmarkController = TextEditingController();

  bool _isLookingUp = false;
  bool _autoFilled = false;
  String? _lookupError;
  String? _selectedPostOffice;
  List<PostOfficeItem> _postOffices = [];
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _prefillForm();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _pincodeController.dispose();
    _cityController.dispose();
    _districtController.dispose();
    _stateController.dispose();
    _nameController.dispose();
    _mobileController.dispose();
    _line1Controller.dispose();
    _line2Controller.dispose();
    _landmarkController.dispose();
    super.dispose();
  }

  void _prefillForm() {
    if (widget.initialData != null) {
      final d = widget.initialData!;
      _nameController.text = d['name'] ?? '';
      _mobileController.text = d['mobile'] ?? '';
      _pincodeController.text = d['pincode'] ?? '';
      _cityController.text = d['city'] ?? '';
      _districtController.text = d['district'] ?? '';
      _stateController.text = d['state'] ?? '';
      _line1Controller.text = d['line1'] ?? '';
      _line2Controller.text = d['line2'] ?? '';
      _landmarkController.text = d['landmark'] ?? '';
    }
  }

  /// Called on every text change in the pincode field.
  /// Uses debounce to avoid repeated API calls.
  void _onPincodeChanged(String value) {
    _debounce?.cancel();

    // Clear previous auto-fill and error state
    setState(() {
      _autoFilled = false;
      _lookupError = null;
      _postOffices = [];
      _selectedPostOffice = null;
    });

    // Only trigger lookup when exactly 6 digits are entered
    if (value.length == 6 && RegExp(r'^[1-9]\d{5}$').hasMatch(value)) {
      _debounce = Timer(const Duration(milliseconds: 400), () {
        _lookupPincode(value);
      });
    }
  }

  Future<void> _lookupPincode(String pincode) async {
    setState(() {
      _isLookingUp = true;
      _lookupError = null;
    });

    final result = await ApiService.lookupPincode(pincode);

    if (!mounted) return;

    setState(() {
      _isLookingUp = false;
    });

    if (result == null) {
      setState(() {
        _lookupError = 'PIN code not found. Please check and try again.';
        _autoFilled = false;
      });
      return;
    }

    // Auto-fill city, district, state
    setState(() {
      _cityController.text = result.city;
      _districtController.text = result.district;
      _stateController.text = result.state;
      _postOffices = result.postOffices;
      _autoFilled = true;
      _lookupError = null;

      // Auto-select first post office if available
      if (_postOffices.isNotEmpty) {
        _selectedPostOffice = _postOffices.first.name;
      }
    });
  }

  /// Returns the current form data as a map.
  Map<String, String> getFormData() {
    return {
      'name': _nameController.text.trim(),
      'mobile': _mobileController.text.trim(),
      'pincode': _pincodeController.text.trim(),
      'line1': _line1Controller.text.trim(),
      'line2': _line2Controller.text.trim(),
      'landmark': _landmarkController.text.trim(),
      'city': _cityController.text.trim(),
      'district': _districtController.text.trim(),
      'state': _stateController.text.trim(),
      'postOffice': _selectedPostOffice ?? '',
      'country': 'India',
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title ?? 'Add Address'),
        centerTitle: true,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Section: Contact
            _buildSectionHeader('Contact Details', scheme),
            const SizedBox(height: 8),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Full Name *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person_outline),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _mobileController,
              decoration: const InputDecoration(
                labelText: 'Mobile Number *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.phone_outlined),
                prefixText: '+91 ',
              ),
              keyboardType: TextInputType.phone,
              maxLength: 10,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (!RegExp(r'^[6-9]\d{9}$').hasMatch(v.trim())) return 'Invalid 10-digit Indian mobile number';
                return null;
              },
            ),

            const SizedBox(height: 24),

            // Section: PIN Code
            _buildSectionHeader('PIN Code', scheme),
            const SizedBox(height: 8),
            TextFormField(
              controller: _pincodeController,
              decoration: InputDecoration(
                labelText: 'PIN Code *',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.location_on_outlined),
                suffixIcon: _isLookingUp
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : _autoFilled
                        ? const Icon(Icons.check_circle, color: Colors.green)
                        : null,
                helperText: 'Enter 6-digit Indian PIN code',
              ),
              keyboardType: TextInputType.number,
              maxLength: 6,
              onChanged: _onPincodeChanged,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (!RegExp(r'^[1-9]\d{5}$').hasMatch(v.trim())) return 'Invalid PIN code format';
                return null;
              },
            ),

            // Lookup error
            if (_lookupError != null)
              Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red.shade600, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _lookupError!,
                        style: TextStyle(color: Colors.red.shade700, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),

            // Auto-fill success indicator
            if (_autoFilled)
              Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green.shade600, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Location auto-detected: ${_cityController.text}, ${_stateController.text}',
                        style: TextStyle(color: Colors.green.shade700, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 16),

            // Section: Address
            _buildSectionHeader('Address Details', scheme),
            const SizedBox(height: 8),
            TextFormField(
              controller: _line1Controller,
              decoration: const InputDecoration(
                labelText: 'Flat / House No. / Building *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.home_outlined),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _line2Controller,
              decoration: const InputDecoration(
                labelText: 'Street / Area / Locality',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.add_road_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _landmarkController,
              decoration: const InputDecoration(
                labelText: 'Landmark (optional)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.place_outlined),
              ),
            ),

            const SizedBox(height: 16),

            // Post Office / Area selection (if multiple)
            if (_postOffices.length > 1) ...[
              _buildSectionHeader('Select Area / Post Office', scheme),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedPostOffice,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.map_outlined),
                ),
                items: _postOffices
                    .map((po) => DropdownMenuItem(
                          value: po.name,
                          child: Text('${po.name} (${po.area})'),
                        ))
                    .toList(),
                onChanged: (v) => setState(() => _selectedPostOffice = v),
              ),
              const SizedBox(height: 16),
            ],

            // Auto-filled fields (editable)
            _buildSectionHeader('Location (Auto-detected)', scheme),
            const SizedBox(height: 8),
            TextFormField(
              controller: _cityController,
              decoration: const InputDecoration(
                labelText: 'City / District *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.location_city_outlined),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _districtController,
              decoration: const InputDecoration(
                labelText: 'District',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.map_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _stateController,
              decoration: const InputDecoration(
                labelText: 'State *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.flag_outlined),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: 'India',
              enabled: false,
              decoration: const InputDecoration(
                labelText: 'Country',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.public),
              ),
            ),

            const SizedBox(height: 32),

            // Save button
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: () {
                  if (_formKey.currentState!.validate()) {
                    final data = getFormData();
                    Navigator.pop(context, data);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: scheme.primary,
                  foregroundColor: scheme.onPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Save Address',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, ColorScheme scheme) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: scheme.primary,
        letterSpacing: 0.5,
      ),
    );
  }
}
