import csv
import json
import re

# --- CMMC Level 3 Controls (Partial List for Demonstration) ---
# In a real application, this would be a comprehensive list.
CMMC_CONTROLS = {
    "AC.L1-3.5.7": "Control the information posted or processed on publicly accessible websites.",
    "AC.L2-3.1.1": "Limit information system access to authorized users, processes acting on behalf of authorized users, and devices (including limiting external access).",
    "AC.L2-3.1.2": "Limit information system access to the types of transactions and functions that authorized users are permitted to execute.",
    "AU.L2-3.3.1": "Create and retain information system audit records.",
    "AU.L2-3.3.2": "Ensure that audit record content makes events traceable back to the initiator of the events.",
    "CA.L2-3.12.2": "Conduct periodic assessments of security controls to verify that the controls are effective in their application.",
    "CM.L2-3.4.1": "Establish and maintain a configuration management system.",
    "IR.L2-3.6.1": "Develop and implement an incident response plan.",
    "MP.L2-3.7.1": "Identify essential missions and business functions and associated supporting resources.",
    "RA.L2-3.11.1": "Periodically assess risk to organizational operations (including mission, functions, image, reputation), organizational assets, and individuals, resulting from the operation of information systems and the associated processing, storage, or transmission of CUI.",
    "SA.L2-3.10.1": "Identify and manage malicious code.",
    # Add more controls as needed for your analysis
}

# Function implementation (from previous response)
def analyze_csv_for_cmmc_compliance(csv_file_path):
    findings_and_gaps = []
    overall_posture = "Requires Significant Improvement"
    try:
        with open(csv_file_path, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            if not reader.fieldnames:
                raise ValueError("CSV file is empty or has no header row.")
            for row in reader:
                if "website_content" in row and "public" in row["website_content"].lower():
                    finding = {
                        "control_id": "AC.L1-3.5.7",
                        "description": "Website content contains potentially sensitive information and lacks appropriate controls for public access.",
                        "3pao_assessment": {
                            "risk_level": "High",
                            "severity": "Critical",
                            "recommendations": [
                                "Review all website content for CUI.  Implement access controls to protect sensitive data.",
                                "Conduct regular audits of website content to ensure compliance."
                            ],
                        },
                        "evidence_required": [
                            "Documentation of website content review process.",
                            "Access control policies and configurations.",
                            "Website audit logs.",
                        ],
                        "expected_compliant_state": "Website content containing CUI is protected by appropriate access controls and regularly reviewed.",
                    }
                    findings_and_gaps.append(finding)
                if "password" in row and len(row["password"]) < 12:
                    finding = {
                        "control_id": "AC.L2-3.1.1, AC.L2-3.1.2",
                        "description": f"Weak password found for user '{row.get('username', 'N/A')}' (length < 12 characters).",
                        "3pao_assessment": {
                            "risk_level": "High",
                            "severity": "High",
                            "recommendations": [
                                "Enforce strong password policies (minimum 12 characters, complexity requirements).",
                                "Implement multi-factor authentication (MFA)."
                            ],
                        },
                        "evidence_required": [
                            "Password policy documentation.",
                            "System configuration showing MFA enabled (if applicable).",
                            "Evidence of password reset/change for affected user.",
                        ],
                        "expected_compliant_state": "All user passwords meet strong password policy requirements.",
                    }
                    findings_and_gaps.append(finding)
                if "audit_log_present" in row and row["audit_log_present"].lower() == "no":
                    finding = {
                        "control_id": "AU.L2-3.3.1, AU.L2-3.3.2",
                        "description": f"Audit logging is not enabled for '{row.get('system_component', 'N/A')}' or audit logs are missing.",
                        "3pao_assessment": {
                            "risk_level": "High",
                            "severity": "Critical",
                            "recommendations": [
                                "Enable audit logging for all relevant system components.",
                                "Ensure audit logs capture sufficient detail to trace events back to their initiators."
                            ],
                        },
                        "evidence_required": [
                            "System configuration demonstrating audit logging enabled.",
                            "Sample audit logs showing event traceability.",
                            "Audit log retention policy.",
                        ],
                        "expected_compliant_state": "Comprehensive audit logs are enabled and retained, capturing all relevant security events with traceability.",
                    }
                    findings_and_gaps.append(finding)
            if not findings_and_gaps:
                overall_posture = "Compliant"
            elif any(f["3pao_assessment"]["risk_level"] == "High" for f in findings_and_gaps):
                overall_posture = "Requires Significant Improvement"
            elif any(f["3pao_assessment"]["risk_level"] == "Medium" for f in findings_and_gaps):
                overall_posture = "Requires Improvement"
            else:
                overall_posture = "Minor Issues Identified"
        report = {
            "overall_compliance_posture": overall_posture,
            "findings_and_gaps": findings_and_gaps,
        }
        return json.dumps(report, indent=2)
    except FileNotFoundError:
        return json.dumps({"error": f"File not found: {csv_file_path}"}, indent=2)
    except (csv.Error, ValueError) as e:
        return json.dumps({"error": f"CSV processing error: {str(e)}"}, indent=2)
    except Exception as e:
        return json.dumps({"error": f"An unexpected error occurred: {str(e)}"}, indent=2)