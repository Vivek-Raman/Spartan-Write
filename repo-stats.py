import argparse
import os
import subprocess
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

EXT_TO_LANG: Dict[str, str] = {
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".jsx": "JavaScript",
    ".java": "Java",
    ".go": "Go",
    ".rb": "Ruby",
    ".php": "PHP",
    ".c": "C",
    ".cpp": "C++",
    ".cs": "C#",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".rs": "Rust",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".sh": "Shell",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".json": "JSON",
    ".md": "Markdown",
    ".xml": "XML",
    ".graphql": "GraphQL",
    ".gql": "GraphQL",
}

EXCLUDED_FILES = {
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "requirements.txt",
    "Pipfile",
    "Pipfile.lock",
    "pyproject.toml",
    "setup.cfg",
    "setup.py",
    "Cargo.toml",
    "Cargo.lock",
    "composer.json",
    "composer.lock",
    "go.mod",
    "go.sum",
}

EXCLUDED_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "target",  # Rust/Cargo build output
    ".next",
    ".turbo",
    "__pycache__",
    "venv",
    "env",
    ".venv",
    ".idea",
    ".vscode",
    ".cache",
    "ui",
    "ai-elements",
    ".pytest_cache",
}


class CodebaseAnalyzer:

    def __init__(
        self,
        root_dir: str = ".",
        excluded_dirs: Optional[set[str]] = None,
        excluded_files: Optional[set[str]] = None,
        ext_to_lang: Optional[Dict[str, str]] = None,
        progress_interval: int = 5,
    ):
        self.root_dir = Path(root_dir)
        self.excluded_dirs = excluded_dirs or EXCLUDED_DIRS
        self.excluded_files = excluded_files or EXCLUDED_FILES
        self.ext_to_lang = ext_to_lang or EXT_TO_LANG

        self.line_counts: Dict[str, int] = defaultdict(int)
        self.files_by_language: Dict[str, List[Tuple[str,
                                                     int]]] = defaultdict(list)

        self._files_processed = 0
        self.progress_interval = progress_interval

    @staticmethod
    def is_ignored_by_git(path: Path) -> bool:
        """Check if a file or directory is ignored by git."""
        try:
            path_str = os.fspath(path)
            result = subprocess.run(
                ["git", "check-ignore", path_str],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return result.returncode == 0
        except KeyboardInterrupt:
            raise
        except FileNotFoundError:
            return False

    @staticmethod
    def count_non_empty_lines(file_path: Path) -> int:
        """Count non-empty lines in a file."""
        try:
            with file_path.open(encoding="utf-8", errors="ignore") as f:
                return sum(1 for line in f if line.strip())
        except (OSError, UnicodeDecodeError):
            return 0

    def _print_progress(self):
        print(f"Processed {self._files_processed} files...")

    def analyze(self) -> None:
        """Walk through the directory tree and analyze code files."""
        for dirpath, dirnames, filenames in os.walk(self.root_dir):
            dirnames[:] = [d for d in dirnames if d not in self.excluded_dirs]

            for filename in filenames:
                if filename in self.excluded_files:
                    continue

                file_path = Path(dirpath) / filename

                if self.is_ignored_by_git(file_path):
                    continue

                ext = file_path.suffix.lower()
                lang = self.ext_to_lang.get(ext)
                if not lang:
                    continue

                line_count = self.count_non_empty_lines(file_path)
                if line_count == 0:
                    continue

                self.line_counts[lang] += line_count
                self.files_by_language[lang].append(
                    (str(file_path), line_count))

                self._files_processed += 1
                if self._files_processed % self.progress_interval == 0:
                    self._print_progress()

        if self._files_processed % self.progress_interval != 0:
            self._print_progress()

    def report(self) -> None:
        """Print a summary report sorted by total lines descending."""
        total = 0
        for lang, total_lines in sorted(self.line_counts.items(),
                                        key=lambda x: x[1],
                                        reverse=True):
            print(f"{lang:15} {total_lines} lines")
            for filepath, lines in sorted(self.files_by_language[lang],
                                          key=lambda x: x[1],
                                          reverse=True):
                print(f"  {lines:6} lines  {filepath}")
            print()
            total += total_lines

        print("=" * 40)
        print(f"{'Total':15} {total} lines")


def main():
    parser = argparse.ArgumentParser(
        description="Analyze a codebase by language and line count.")
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to the root of the codebase (default: current directory)",
    )
    args = parser.parse_args()

    os.chdir(args.path)

    analyzer = CodebaseAnalyzer(".")
    analyzer.analyze()
    analyzer.report()


if __name__ == "__main__":
    main()
