"""
OnShape Thumbnail Extractor

Extracts thumbnails and BOM data from OnShape assemblies.
Refactored into modular classes for maintainability.
"""

import csv
import json
import os
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import requests
from dotenv import load_dotenv


# =============================================================================
# Configuration
# =============================================================================

@dataclass(frozen=True)
class OnShapeConfig:
    """Immutable configuration for OnShape API."""
    
    base_api_url: str = "https://cad.onshape.com/api/v12"
    default_thumbnail_size: str = "300x300"
    fallback_thumbnail_sizes: tuple = ("600x340", "300x170", "70x40")
    request_timeout: int = 10
    
    @property
    def headers_json(self) -> dict:
        return {
            'Accept': 'application/json;charset=UTF-8; qs=0.09',
            'Content-Type': 'application/json'
        }
    
    @property
    def headers_image(self) -> dict:
        return {'Accept': 'image/*'}


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class OnShapeCredentials:
    """OnShape API credentials."""
    access_key: str
    secret_key: str
    
    @property
    def auth_tuple(self) -> tuple:
        return (self.access_key, self.secret_key)


@dataclass
class ParsedOnShapeURL:
    """Parsed components of an OnShape URL."""
    document_id: str
    wvm_type: str  # 'w' = workspace, 'v' = version, 'm' = microversion
    wvm_id: str
    element_id: str
    
    @property
    def wvm_type_description(self) -> str:
        descriptions = {'w': 'workspace', 'v': 'version', 'm': 'microversion'}
        return descriptions.get(self.wvm_type, 'unknown')


@dataclass
class ThumbnailResult:
    """Result of a thumbnail download attempt."""
    part_number: str
    part_name: str
    thumbnail_downloaded: bool = False
    thumbnail_size: Optional[str] = None
    thumbnail_filename: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error_code: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "part_number": self.part_number,
            "part_name": self.part_name,
            "thumbnail_downloaded": self.thumbnail_downloaded,
            "thumbnail_size": self.thumbnail_size,
            "thumbnail_filename": self.thumbnail_filename,
            "thumbnail_URL": self.thumbnail_url,
            "error_code": self.error_code
        }


@dataclass
class ExtractionSummary:
    """Summary of the extraction process."""
    total_items: int = 0
    successful: int = 0
    failed: int = 0
    results: list = field(default_factory=list)
    
    def add_result(self, result: ThumbnailResult):
        self.results.append(result)
        self.total_items += 1
        if result.thumbnail_downloaded:
            self.successful += 1
        else:
            self.failed += 1


# =============================================================================
# URL Parser
# =============================================================================

class OnShapeURLParser:
    """Parses OnShape URLs into their component parts."""
    
    @staticmethod
    def parse(url: str) -> Optional[ParsedOnShapeURL]:
        """
        Parse a versioned OnShape assembly link.
        
        Supported formats:
        - Versioned: https://cad.onshape.com/documents/{did}/v/{vid}/e/{eid}
        - Workspace: https://cad.onshape.com/documents/{did}/w/{wid}/e/{eid}
        - Microversion: https://cad.onshape.com/documents/{did}/m/{mid}/e/{eid}
        
        Returns:
            ParsedOnShapeURL or None if parsing fails
        """
        try:
            parts = url.strip().split('/')
            doc_index = parts.index("documents")
            
            document_id = parts[doc_index + 1]
            wvm_type = parts[doc_index + 2]
            wvm_id = parts[doc_index + 3]
            
            # Find element ID (follows 'e' segment)
            e_index = parts.index('e', doc_index)
            element_id = parts[e_index + 1].split('?')[0]  # Remove query params
            
            return ParsedOnShapeURL(
                document_id=document_id,
                wvm_type=wvm_type,
                wvm_id=wvm_id,
                element_id=element_id
            )
        except (ValueError, IndexError):
            return None


# =============================================================================
# OnShape API Client
# =============================================================================

class OnShapeAPIClient:
    """Client for interacting with the OnShape API."""
    
    def __init__(self, credentials: OnShapeCredentials, config: OnShapeConfig = None):
        self.credentials = credentials
        self.config = config or OnShapeConfig()
    
    def build_bom_url(self, parsed_url: ParsedOnShapeURL) -> str:
        """Build the BOM API URL from parsed URL components."""
        return (
            f"{self.config.base_api_url}/assemblies"
            f"/d/{parsed_url.document_id}"
            f"/{parsed_url.wvm_type}/{parsed_url.wvm_id}"
            f"/e/{parsed_url.element_id}/bom"
            "?indented=true"
            "&multiLevel=true"
            "&generateIfAbsent=false"
            "&includeExcluded=false"
            "&ignoreSubassemblyBomBehavior=false"
            "&includeItemMicroversions=true"
            "&includeTopLevelAssemblyRow=true"
            "&thumbnail=true"
        )
    
    def fetch_bom(self, parsed_url: ParsedOnShapeURL) -> Optional[dict]:
        """Fetch BOM data from OnShape API."""
        url = self.build_bom_url(parsed_url)
        
        response = requests.get(
            url,
            headers=self.config.headers_json,
            auth=self.credentials.auth_tuple,
            timeout=self.config.request_timeout
        )
        
        if response.status_code != 200:
            self._log_api_error(response)
            return None
        
        return response.json()
    
    def fetch_image(self, url: str) -> Optional[bytes]:
        """Fetch an image from OnShape API."""
        response = requests.get(
            url,
            headers=self.config.headers_image,
            auth=self.credentials.auth_tuple,
            timeout=self.config.request_timeout
        )
        
        if response.status_code == 200:
            return response.content
        return None
    
    def fetch_thumbnail_metadata(self, base_url: str) -> Optional[dict]:
        """Fetch thumbnail metadata to discover available sizes."""
        response = requests.get(
            base_url,
            headers=self.config.headers_json,
            auth=self.credentials.auth_tuple,
            timeout=self.config.request_timeout
        )
        
        if response.status_code == 200:
            return response.json()
        return None
    
    def _log_api_error(self, response: requests.Response):
        """Log detailed API error information."""
        print(f"API Error - Status code: {response.status_code}")
        
        error_messages = {
            401: "Unauthorized - Check your API credentials",
            403: "Forbidden - You don't have permission to access this document",
            404: (
                "Not Found - Possible causes:\n"
                "  1. Document/element does not exist\n"
                "  2. Element is not an Assembly (must be Assembly type)\n"
                "  3. You don't have access to this document\n"
                "  4. Invalid API credentials"
            )
        }
        
        if response.status_code in error_messages:
            print(f"\n{error_messages[response.status_code]}")
        
        print(f"\nResponse: {response.text[:500]}...")


# =============================================================================
# Thumbnail Downloader
# =============================================================================

class ThumbnailDownloader:
    """
    Downloads thumbnails from OnShape with intelligent fallback strategy.
    
    Strategy:
    1. Try default 300x300 size
    2. If fails, fetch metadata to discover available sizes
    3. Try fallback sizes in priority order
    4. Try any remaining available sizes
    """
    
    def __init__(self, api_client: OnShapeAPIClient, config: OnShapeConfig = None):
        self.api_client = api_client
        self.config = config or OnShapeConfig()
    
    def download(
        self,
        thumbnail_url: str,
        part_number: str,
        part_name: str,
        output_folder: str
    ) -> ThumbnailResult:
        """Download a thumbnail with fallback strategy."""
        result = ThumbnailResult(
            part_number=part_number,
            part_name=part_name,
            thumbnail_url=thumbnail_url
        )
        
        save_folder = self._get_save_folder(part_number, output_folder)
        safe_filename = self._sanitize_filename(part_number)
        base_url = self._extract_base_url(thumbnail_url)
        
        # Step 1: Try default size
        if self._try_download_size(base_url, self.config.default_thumbnail_size, 
                                    safe_filename, save_folder, result):
            return result
        
        # Step 2: Fetch metadata for available sizes
        metadata = self.api_client.fetch_thumbnail_metadata(base_url)
        if not metadata:
            result.error_code = "METADATA_FETCH_FAILED"
            return result
        
        available_sizes = metadata.get("sizes", [])
        if not available_sizes:
            result.error_code = "NO_SIZES_IN_METADATA"
            return result
        
        # Step 3: Try fallback sizes in priority order
        for size in self.config.fallback_thumbnail_sizes:
            size_info = self._find_size_info(available_sizes, size)
            if size_info and self._try_download_href(
                size_info.get("href"), size, safe_filename, save_folder, result
            ):
                return result
        
        # Step 4: Try any remaining sizes
        tried_sizes = {self.config.default_thumbnail_size} | set(self.config.fallback_thumbnail_sizes)
        for size_info in available_sizes:
            size = size_info.get("size")
            if size and size not in tried_sizes:
                if self._try_download_href(
                    size_info.get("href"), size, safe_filename, save_folder, result
                ):
                    return result
        
        result.error_code = "NO_DOWNLOADABLE_SIZES"
        return result
    
    def _get_save_folder(self, part_number: str, output_folder: str) -> str:
        """Determine save folder based on part number prefix."""
        if part_number.upper().startswith(('PRT', 'ASM')):
            folder = os.path.join(output_folder, "thumbnails")
        else:
            folder = os.path.join(output_folder, "thumbnails_ignored")
        
        os.makedirs(folder, exist_ok=True)
        return folder
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for filesystem."""
        return re.sub(r'[/\\:]', '-', filename)
    
    def _extract_base_url(self, thumbnail_url: str) -> str:
        """Extract base URL without size parameter."""
        if "/s/" in thumbnail_url:
            return thumbnail_url.split("/s/")[0]
        return thumbnail_url
    
    def _find_size_info(self, sizes: list, target_size: str) -> Optional[dict]:
        """Find size info for a specific size."""
        for size_info in sizes:
            if size_info.get("size") == target_size:
                return size_info
        return None
    
    def _try_download_size(
        self,
        base_url: str,
        size: str,
        filename: str,
        save_folder: str,
        result: ThumbnailResult
    ) -> bool:
        """Try to download a specific size thumbnail."""
        url = f"{base_url}/s/{size}"
        return self._try_download_href(url, size, filename, save_folder, result)
    
    def _try_download_href(
        self,
        href: str,
        size: str,
        filename: str,
        save_folder: str,
        result: ThumbnailResult
    ) -> bool:
        """Try to download from a specific href."""
        if not href:
            return False
        
        image_data = self.api_client.fetch_image(href)
        if image_data:
            image_path = os.path.join(save_folder, f"{filename}.png")
            with open(image_path, 'wb') as f:
                f.write(image_data)
            
            result.thumbnail_downloaded = True
            result.thumbnail_size = size
            result.thumbnail_filename = f"{filename}.png"
            result.thumbnail_url = href
            print(f"  Saved: {image_path} (size: {size})")
            return True
        
        return False


# =============================================================================
# BOM Processor
# =============================================================================

class BOMProcessor:
    """Processes BOM data from OnShape."""
    
    # OnShape field IDs
    PART_NUMBER_FIELD_ID = "57f3fb8efa3416c06701d60f"
    NAME_FIELD_ID = "57f3fb8efa3416c06701d60d"
    
    @staticmethod
    def get_assembly_info(bom_data: dict) -> tuple:
        """
        Extract assembly name and version from BOM response.
        
        Returns:
            tuple: (document_name, version_name) sanitized for filesystem
        """
        bom_source = bom_data.get("bomSource", {})
        doc_name = bom_source.get("document", {}).get("name", "Assembly")
        
        # Prefer workspace name, fall back to version
        workspace_info = bom_source.get("workspace", {})
        if workspace_info and workspace_info.get("name"):
            version_name = workspace_info.get("name")
        else:
            version_info = bom_source.get("version", {})
            version_name = version_info.get("name", "workspace") if version_info else "workspace"
        
        # Sanitize for filesystem
        doc_name = doc_name.replace(" ", "_").replace("/", "-")
        version_name = version_name.replace(" ", "_").replace("/", "-")
        
        return doc_name, version_name
    
    @classmethod
    def get_part_number(cls, row: dict) -> str:
        """Extract part number from a BOM row."""
        header_values = row.get('headerIdToValue', {})
        part_number = header_values.get(cls.PART_NUMBER_FIELD_ID, "")
        
        if not part_number:
            part_number = header_values.get(cls.NAME_FIELD_ID, "unknown")
        
        return part_number or "unknown"
    
    @staticmethod
    def get_part_name(row: dict) -> str:
        """Extract part name from a BOM row."""
        return row.get('itemSource', {}).get('itemName', "unknown")
    
    @staticmethod
    def get_thumbnail_url(row: dict, preferred_size: str = "300x300") -> Optional[str]:
        """Extract thumbnail URL from a BOM row."""
        thumb_info = row.get('itemSource', {}).get('thumbnailInfo', {})
        sizes = thumb_info.get('sizes', [])
        
        for size_info in sizes:
            if size_info.get('size') == preferred_size:
                return size_info.get('href')
        
        return None


# =============================================================================
# Report Generators
# =============================================================================

class ReportGenerator(ABC):
    """Abstract base class for report generators."""
    
    @abstractmethod
    def generate(self, output_folder: str, summary: ExtractionSummary, bom_data: dict) -> Optional[str]:
        """Generate a report and return the file path."""
        pass


class JSONReportGenerator(ReportGenerator):
    """Generates JSON reports for thumbnail extraction."""
    
    def generate(
        self,
        output_folder: str,
        summary: ExtractionSummary,
        bom_data: dict
    ) -> Optional[str]:
        """Generate JSON report with download statistics."""
        failure_breakdown = self._analyze_failures(summary.results)
        
        report = {
            "metadata": {
                "total_items": summary.total_items,
                "successful_downloads": summary.successful,
                "failed_downloads": failure_breakdown,
                "success_rate": f"{(summary.successful / summary.total_items * 100):.1f}%" 
                               if summary.total_items else "0%",
                "assembly_name": output_folder
            },
            "items": [r.to_dict() for r in summary.results]
        }
        
        filepath = os.path.join(output_folder, "thumbnail_report.json")
        try:
            with open(filepath, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"Report saved to: {filepath}")
            return filepath
        except Exception as e:
            print(f"Error saving JSON report: {e}")
            return None
    
    def _analyze_failures(self, results: list) -> dict:
        """Analyze failure codes and return breakdown."""
        failed_items = [r for r in results if not r.thumbnail_downloaded]
        failure_codes = {"404_fail": 0, "403_fail": 0, "other": 0}
        
        for item in failed_items:
            error_code = item.error_code or "UNKNOWN"
            if "404" in error_code:
                failure_codes["404_fail"] += 1
            elif "403" in error_code:
                failure_codes["403_fail"] += 1
            else:
                failure_codes["other"] += 1
        
        return {
            "total_failed": len(failed_items),
            **failure_codes
        }


class CSVReportGenerator(ReportGenerator):
    """Generates CSV reports from BOM data."""
    
    def generate(
        self,
        output_folder: str,
        summary: ExtractionSummary,
        bom_data: dict
    ) -> Optional[str]:
        """Convert BOM data to CSV."""
        filepath = os.path.join(output_folder, "bom_data.csv")
        
        try:
            headers = bom_data.get('headers', [])
            rows = bom_data.get('rows', [])
            columns = self._get_ordered_columns(headers)
            
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([col[1] for col in columns])
                
                for row in rows:
                    csv_row = [
                        self._extract_cell_value(row, col[0], col[2])
                        for col in columns
                    ]
                    writer.writerow(csv_row)
            
            print(f"BOM data exported to CSV: {filepath} ({len(rows)} rows)")
            return filepath
        except Exception as e:
            print(f"Error converting BOM to CSV: {e}")
            return None
    
    def _get_ordered_columns(self, headers: list, visible_only: bool = False) -> list:
        """Get ordered list of columns from headers."""
        columns = []
        seen = set()
        
        for header in headers:
            if visible_only and not header.get('visible', True):
                continue
            
            header_id = header.get('id') or header.get('propertyName')
            property_name = header.get('propertyName')
            display_name = header.get('name', property_name)
            
            if header_id not in seen:
                columns.append((header_id, display_name, property_name))
                seen.add(header_id)
        
        return columns
    
    def _extract_cell_value(self, row: dict, header_id: str, property_name: str) -> str:
        """Extract cell value from a row."""
        # Try direct lookups
        for key in [header_id, property_name]:
            if key and key in row:
                return self._format_value(row[key])
        
        # Check nested structures
        for nested_key in ['values', 'properties', 'headerIdToValue']:
            if nested_key in row and isinstance(row[nested_key], dict):
                nested = row[nested_key]
                for key in [header_id, property_name]:
                    if key and key in nested:
                        return self._format_value(nested[key])
        
        return ''
    
    def _format_value(self, value) -> str:
        """Format a value for CSV output."""
        if value is None:
            return ''
        if isinstance(value, bool):
            return str(value).lower()
        if isinstance(value, dict):
            for key in ['displayName', 'value', 'name']:
                if key in value:
                    formatted = str(value[key])
                    break
            else:
                formatted = json.dumps(value)
        elif isinstance(value, list):
            formatted = '; '.join(self._format_value(v) for v in value)
        else:
            formatted = str(value)
        
        # Sanitize for CSV
        formatted = formatted.replace(', ', ' ')
        formatted = formatted.replace(',', '_')
        formatted = formatted.replace('\n', '_').replace('\r', '_')
        return formatted


class BOMDataSaver:
    """Saves raw BOM data to JSON file."""
    
    @staticmethod
    def save(output_folder: str, bom_data: dict) -> Optional[str]:
        """Save BOM data to JSON file."""
        filepath = os.path.join(output_folder, "bom_data.json")
        try:
            with open(filepath, 'w') as f:
                json.dump(bom_data, f, indent=2)
            print(f"BOM data saved to: {filepath}")
            return filepath
        except Exception as e:
            print(f"Error saving BOM data: {e}")
            return None


# =============================================================================
# Credential Loader
# =============================================================================

class CredentialLoader:
    """Loads OnShape credentials from environment or user input."""
    
    @staticmethod
    def load() -> OnShapeCredentials:
        """Load credentials from .env file or prompt user."""
        load_dotenv()
        
        access_key = os.getenv("ONSHAPE_ACCESS_KEY", "").strip()
        secret_key = os.getenv("ONSHAPE_SECRET_KEY", "").strip()
        
        if access_key and secret_key:
            print("Loaded OnShape credentials from .env file.")
        else:
            print("Credentials not found in .env file.")
            access_key = input("Enter your OnShape access key: ").strip()
            secret_key = input("Enter your OnShape secret key: ").strip()
        
        return OnShapeCredentials(access_key=access_key, secret_key=secret_key)


# =============================================================================
# Main Application
# =============================================================================

class ThumbnailExtractor:
    """
    Main application class that orchestrates the thumbnail extraction process.
    """
    
    def __init__(self, credentials: OnShapeCredentials, config: OnShapeConfig = None):
        self.config = config or OnShapeConfig()
        self.api_client = OnShapeAPIClient(credentials, self.config)
        self.downloader = ThumbnailDownloader(self.api_client, self.config)
        self.bom_processor = BOMProcessor()
        self.report_generators = [
            JSONReportGenerator(),
            CSVReportGenerator()
        ]
    
    def run(self, onshape_url: str) -> bool:
        """
        Run the thumbnail extraction process.
        
        Args:
            onshape_url: OnShape assembly URL
            
        Returns:
            True if successful, False otherwise
        """
        # Parse URL
        parsed_url = OnShapeURLParser.parse(onshape_url)
        if not parsed_url:
            self._print_url_format_help()
            return False
        
        self._print_parsed_url(parsed_url)
        
        # Fetch BOM data
        print("\nFetching BOM data...")
        bom_data = self.api_client.fetch_bom(parsed_url)
        if not bom_data:
            print("Failed to fetch BOM data.")
            return False
        
        # Create output folder
        output_folder = self._create_output_folder(bom_data)
        print(f"\nThumbnails will be saved in: {output_folder}")
        
        # Save raw BOM data
        BOMDataSaver.save(output_folder, bom_data)
        
        # Process rows
        rows = bom_data.get("rows", [])
        print(f"Found {len(rows)} rows in BOM\n")
        
        summary = self._process_rows(rows, output_folder)
        
        # Print summary
        self._print_summary(summary, len(rows))
        
        # Generate reports
        for generator in self.report_generators:
            generator.generate(output_folder, summary, bom_data)
        
        return True
    
    def _create_output_folder(self, bom_data: dict) -> str:
        """Create output folder with timestamp."""
        assembly_name, version_name = self.bom_processor.get_assembly_info(bom_data)
        timestamp = datetime.now().strftime("%Y-%m-%d-T%H-%M-%S")
        folder = f"thumbnail_extraction/{assembly_name}_{version_name}_{timestamp}"
        os.makedirs(folder, exist_ok=True)
        return folder
    
    def _process_rows(self, rows: list, output_folder: str) -> ExtractionSummary:
        """Process all BOM rows and download thumbnails."""
        summary = ExtractionSummary()
        
        for i, row in enumerate(rows, 1):
            part_number = self.bom_processor.get_part_number(row)
            part_name = self.bom_processor.get_part_name(row)
            print(f"[{i}/{len(rows)}] Processing: {part_number}")
            
            thumbnail_url = self.bom_processor.get_thumbnail_url(row)
            
            if thumbnail_url:
                result = self.downloader.download(
                    thumbnail_url, part_number, part_name, output_folder
                )
            else:
                print(f"  No thumbnail found for: {part_number}")
                result = ThumbnailResult(
                    part_number=part_number,
                    part_name=part_name,
                    error_code="NO_THUMBNAIL_URL"
                )
            
            summary.add_result(result)
        
        return summary
    
    def _print_parsed_url(self, parsed_url: ParsedOnShapeURL):
        """Print parsed URL information."""
        print("Parsed IDs:")
        print(f"  Document: {parsed_url.document_id}")
        print(f"  WVM Type: {parsed_url.wvm_type} ({parsed_url.wvm_type_description})")
        print(f"  WVM ID: {parsed_url.wvm_id}")
        print(f"  Element: {parsed_url.element_id}")
    
    def _print_url_format_help(self):
        """Print help for URL format."""
        print("Invalid OnShape URL format.")
        print("Expected formats:")
        print("  Versioned: https://cad.onshape.com/documents/{did}/v/{vid}/e/{eid}")
        print("  Workspace: https://cad.onshape.com/documents/{did}/w/{wid}/e/{eid}")
    
    def _print_summary(self, summary: ExtractionSummary, total_rows: int):
        """Print extraction summary."""
        print(f"\n{'='*50}")
        print("Download complete!")
        print(f"  Successful: {summary.successful}")
        print(f"  Failed: {summary.failed}")
        print(f"  Total rows: {total_rows}")
        print(f"{'='*50}")


# =============================================================================
# Entry Point
# =============================================================================

def main():
    """Main entry point for the application."""
    try:
        # Get user input
        link = input("Paste your versioned OnShape assembly link: ").strip()
        credentials = CredentialLoader.load()
        
        # Run extraction
        extractor = ThumbnailExtractor(credentials)
        extractor.run(link)
        
        input("\nPress Enter to exit...")
        
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")


if __name__ == "__main__":
    main()