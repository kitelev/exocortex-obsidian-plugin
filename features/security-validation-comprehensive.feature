@security @validation @data-integrity @privacy
Feature: Security and Input Validation - Data Protection and System Integrity
  As a security-conscious user of the Exocortex plugin
  I want comprehensive input validation and security measures
  So that my data remains protected and the system remains stable

  Background:
    Given the Exocortex plugin is initialized
    And security validation is enabled
    And the RDF validator system is active
    And I have appropriate system permissions

  @input-validation @rdf-security @malicious-data
  Scenario: Validate RDF input and reject malicious content
    Given I am importing RDF data
    When I provide the following potentially malicious inputs:
      | input_type        | malicious_content                           |
      | script_injection  | <script>alert('xss')</script>              |
      | sql_injection     | '; DROP TABLE assets; --                    |
      | path_traversal    | ../../../etc/passwd                         |
      | xml_bomb         | <!ENTITY lol "&lol;&lol;">                  |
      | oversized_data   | 10MB string of repeated characters          |
    Then all malicious content should be rejected
    And appropriate error messages should be returned:
      | input_type       | error_message                              |
      | script_injection | HTML/JavaScript content not allowed       |
      | sql_injection    | Invalid characters in input                |
      | path_traversal   | Path traversal patterns detected          |
      | xml_bomb        | XML entity expansion limit exceeded        |
      | oversized_data  | Input size exceeds maximum allowed limit   |

  @uri-validation @iri-security @semantic-integrity
  Scenario: Validate IRI/URI format and security
    Given I am creating or updating RDF triples
    When I provide the following URI/IRI inputs:
      | uri_input                                    | should_be_valid | reason                    |
      | http://example.com/resource                  | true           | Valid HTTP URI            |
      | https://secure.example.com/resource          | true           | Valid HTTPS URI           |
      | ftp://files.example.com/document.txt         | true           | Valid FTP URI             |
      | urn:uuid:12345678-1234-1234-1234-123456789012| true           | Valid URN                 |
      | file:///local/path/document                  | false          | File URIs not allowed     |
      | javascript:alert('xss')                      | false          | Dangerous scheme          |
      | data:text/html,<script>alert('xss')</script> | false          | Data URIs not allowed     |
      | http://                                      | false          | Incomplete URI            |
      | not-a-uri                                    | false          | Invalid format            |
      | http://very-long-domain-name...2048-chars... | false          | URI too long              |
    Then the validation should match the expected results
    And invalid URIs should be rejected with specific error messages

  @literal-validation @datatype-security @type-safety
  Scenario: Validate RDF literals against declared datatypes
    Given I am creating RDF triples with typed literals
    When I provide the following literal values:
      | literal_value    | declared_datatype                 | should_be_valid |
      | 42              | http://www.w3.org/2001/XMLSchema#integer | true     |
      | 3.14159         | http://www.w3.org/2001/XMLSchema#decimal | true     |
      | true            | http://www.w3.org/2001/XMLSchema#boolean | true     |
      | 2025-01-15      | http://www.w3.org/2001/XMLSchema#date    | true     |
      | not-a-number    | http://www.w3.org/2001/XMLSchema#integer | false    |
      | 999999999999999999999999999999999999999 | http://www.w3.org/2001/XMLSchema#integer | false    |
      | <script>        | http://www.w3.org/2001/XMLSchema#string  | false    |
    Then literal validation should match expected results
    And type coercion should be applied where safe
    And dangerous content should be sanitized or rejected

  @query-injection @sparql-security @query-validation
  Scenario: Prevent SPARQL injection attacks
    Given I have a SPARQL query interface
    When I provide the following potentially malicious queries:
      | query_input                                      | threat_type        |
      | SELECT * WHERE { ?s ?p ?o } ; DROP GRAPH <g>    | query_chaining     |
      | SELECT * WHERE { ?s ?p "'; DELETE DATA {...     | string_escape      |
      | CONSTRUCT { <../../../etc/passwd> ?p ?o }       | path_traversal     |
      | SELECT * WHERE { SERVICE <http://evil.com/> {}} | external_service   |
    Then all malicious queries should be rejected
    And the query parser should detect injection patterns
    And safe query execution should be maintained
    And detailed security logs should be created

  @file-access @path-validation @filesystem-security
  Scenario: Validate file paths and prevent unauthorized access
    Given I am importing or exporting data
    When I provide the following file paths:
      | file_path                           | should_be_allowed | reason                    |
      | ./data/export.ttl                  | true             | Relative path in safe dir |
      | /vault/notes/knowledge.rdf         | true             | Absolute path in vault    |
      | ../../../etc/passwd                | false            | Path traversal attempt    |
      | C:\Windows\System32\config\sam     | false            | System file access        |
      | /proc/self/environ                 | false            | Process information       |
      | data/export.ttl; rm -rf /          | false            | Command injection         |
      | \\network-share\files\data.rdf     | false            | Network path not allowed  |
    Then path validation should match expected results
    And unauthorized paths should be blocked
    And safe paths should be canonicalized
    And all file access should be logged

  @data-size-limits @dos-prevention @resource-protection
  Scenario: Enforce data size and resource limits
    Given I am processing various types of data
    When I provide inputs with different sizes:
      | data_type       | size        | should_be_accepted | limit_type        |
      | rdf_graph       | 1MB         | true              | Normal processing |
      | rdf_graph       | 100MB       | false             | Memory limit      |
      | sparql_query    | 1KB         | true              | Normal query      |
      | sparql_query    | 1MB         | false             | Query complexity  |
      | literal_string  | 10KB        | true              | Normal text       |
      | literal_string  | 10MB        | false             | String length     |
      | property_count  | 100         | true              | Normal asset      |
      | property_count  | 10000       | false             | Property limit    |
    Then size limits should be enforced
    And resource exhaustion should be prevented
    And appropriate error messages should indicate limits
    And system stability should be maintained

  @character-encoding @unicode-security @text-validation
  Scenario: Handle character encoding and Unicode security
    Given I am processing text inputs
    When I provide the following character encodings:
      | input_text              | encoding_issue          | should_be_handled |
      | Normal ASCII text       | none                    | true             |
      | Café with UTF-8         | valid_unicode          | true             |
      | �invalid_bytes          | invalid_utf8           | sanitized        |
      | \u0000null_byte         | null_byte              | rejected         |
      | \uFEFFbom_character     | byte_order_mark        | stripped         |
      | \u202Eright_to_left     | rtl_override           | sanitized        |
      | 🎭emoji_content         | valid_emoji            | true             |
    Then character encoding should be handled safely
    And invalid sequences should be sanitized
    And bidirectional text attacks should be prevented
    And all text should be properly validated

  @permission-validation @access-control @authorization
  Scenario: Validate user permissions for operations
    Given I have different user permission levels
    When I attempt various operations:
      | operation          | permission_required | user_has_permission | should_succeed |
      | read_asset         | read               | true                | true          |
      | create_asset       | write              | true                | true          |
      | modify_asset       | write              | false               | false         |
      | delete_asset       | admin              | false               | false         |
      | export_data        | export             | true                | true          |
      | import_data        | import             | false               | false         |
      | modify_ontology    | admin              | true                | true          |
    Then operations should succeed only with proper permissions
    And unauthorized attempts should be logged
    And appropriate error messages should be returned
    And the system should fail securely

  @privacy-protection @data-anonymization @sensitive-data
  Scenario: Protect sensitive data and maintain privacy
    Given I have assets containing potentially sensitive information
    When the system processes data containing:
      | sensitive_content      | protection_needed        |
      | email_addresses        | mask_or_anonymize       |
      | phone_numbers          | mask_or_anonymize       |
      | social_security_numbers| redact_completely       |
      | credit_card_numbers    | redact_completely       |
      | ip_addresses           | anonymize_partial       |
      | personal_names         | context_dependent       |
    Then sensitive data should be protected according to policies
    And data anonymization should be applied where configured
    And audit logs should track sensitive data access
    And privacy regulations should be respected

  @crypto-validation @hash-integrity @digital-signatures
  Scenario: Validate cryptographic elements and maintain integrity
    Given I am working with cryptographically protected data
    When I encounter the following cryptographic elements:
      | crypto_element     | validation_required                    |
      | file_hashes        | Verify against known good values       |
      | digital_signatures | Validate signature and certificate     |
      | encrypted_data     | Ensure proper encryption standards     |
      | random_tokens      | Validate entropy and uniqueness        |
    Then cryptographic validation should be performed
    And integrity checks should pass for valid data
    And tampered data should be detected and rejected
    And cryptographic errors should be handled securely

  @session-security @token-management @authentication
  Scenario: Manage session security and authentication tokens
    Given I have an active plugin session
    When I perform operations over time:
      | time_elapsed | operation_type    | expected_behavior              |
      | 5_minutes    | normal_operation  | Continue with valid session    |
      | 30_minutes   | sensitive_op      | Re-validate if configured      |
      | 4_hours      | any_operation     | Session should remain valid    |
      | 24_hours     | startup           | Check for session validity     |
    Then session management should be appropriate for a local plugin
    And any authentication tokens should be managed securely
    And sensitive operations should have additional validation
    And session data should be protected from tampering

  @audit-logging @security-monitoring @forensics
  Scenario: Maintain comprehensive audit logs for security events
    Given the security monitoring system is active
    When various security-relevant events occur:
      | event_type              | should_be_logged | log_level | details_included        |
      | successful_validation   | true            | info      | Input type, size        |
      | validation_failure      | true            | warning   | Failure reason, input   |
      | permission_denied       | true            | warning   | User, operation, time   |
      | malicious_input_detected| true            | error     | Full details, source    |
      | system_security_error   | true            | error     | Error type, stack trace |
      | configuration_change    | true            | info      | Old/new values         |
    Then all specified events should be logged appropriately
    And logs should include sufficient detail for investigation
    And log integrity should be maintained
    And sensitive data should not be logged in plain text

  @error-handling @security-failures @graceful-degradation
  Scenario: Handle security failures gracefully and securely
    Given the system encounters various security issues
    When security validation fails:
      | failure_type           | system_response                        |
      | input_validation_error | Reject input, log error, show safe msg|
      | permission_denied      | Return 403, log attempt, no details    |
      | resource_exhaustion    | Graceful degradation, rate limiting    |
      | crypto_validation_fail | Reject operation, secure cleanup       |
      | injection_attempt      | Block request, detailed logging        |
    Then the system should fail securely
    And sensitive information should not be exposed
    And appropriate error recovery should occur
    And the system should remain stable and functional

  @compliance @gdpr @data-protection
  Scenario: Ensure compliance with data protection regulations
    Given I am subject to data protection regulations
    When the system processes personal data:
      | compliance_requirement  | system_implementation              |
      | data_minimization       | Only collect necessary data        |
      | purpose_limitation      | Use data only for stated purpose   |
      | storage_limitation      | Implement data retention policies  |
      | accuracy_principle      | Provide data correction mechanisms |
      | security_safeguards     | Implement technical protections    |
      | user_rights            | Support access, deletion requests  |
    Then all compliance requirements should be met
    And user rights should be respected and supported
    And data processing should be lawful and transparent
    And appropriate documentation should be maintained

  @penetration-testing @security-assessment @vulnerability-scanning
  Scenario: Withstand common security attacks
    Given the system is under security assessment
    When common attack vectors are tested:
      | attack_type                | attack_description                    |
      | cross_site_scripting      | XSS payloads in various inputs       |
      | sql_injection             | SQL injection in query parameters    |
      | path_traversal            | Directory traversal attempts         |
      | command_injection         | OS command injection attempts        |
      | xxe_attacks               | XML external entity attacks          |
      | deserialization_attacks   | Malicious serialized objects         |
      | buffer_overflow           | Oversized inputs to cause overflow   |
    Then all attack vectors should be successfully defended
    And no unauthorized access should be possible
    And system stability should be maintained
    And security measures should log attack attempts

  @configuration-security @secure-defaults @hardening
  Scenario: Maintain secure configuration and defaults
    Given the plugin is being configured
    When security-related settings are evaluated:
      | setting_category        | secure_default           | rationale                    |
      | input_validation        | strict_mode_enabled       | Prevent malicious input      |
      | logging_level          | info_with_security_events | Adequate monitoring          |
      | resource_limits        | conservative_limits       | Prevent resource exhaustion  |
      | network_access         | disabled_by_default      | Minimize attack surface     |
      | file_permissions       | restrictive_access       | Limit unauthorized access   |
      | error_disclosure       | minimal_information      | Prevent information leakage |
    Then secure defaults should be applied
    And configuration should follow security best practices
    And insecure settings should require explicit user approval
    And security implications should be clearly documented