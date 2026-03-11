from core.settings.common import get_config_dir
import tomlkit


def is_first_run() -> bool:
    return not get_config_dir().exists()


def setup_first_run() -> None:
    config_dir = get_config_dir()
    config_dir.mkdir(parents=True, exist_ok=True)

    default_config = tomlkit.table()
    default_config["foo"] = "bar"

    config_file = config_dir / "config.toml"
    config_file.write_text(default_config.as_string(), encoding="utf-8")
