#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: build_kity_ico.py
# 作者: wuhao
# 日期: 2026_04_17_08:28:46
# 描述: Build multi-size kity.ico from kity.png for Windows icon packaging.

from __future__ import annotations

import struct
from io import BytesIO
from pathlib import Path

from PIL import Image


class KityIcoBuilder:
    """
    Kity ICO builder.

    Args:
        None.

    Returns:
        None.

    Raises:
        None.
    """

    def __init__(self, public_dir: Path) -> None:
        """
        Initialize builder.

        Args:
            public_dir: Public assets directory.

        Returns:
            None.

        Raises:
            ValueError: Raised when directory is invalid.
        """
        if not public_dir.exists() or not public_dir.is_dir():
            raise ValueError("public_dir is not a directory")
        self._public_dir = public_dir

    def build(self) -> Path:
        """
        Build multi-size kity.ico from kity.png.

        Args:
            None.

        Returns:
            Path: Output ico file path.

        Raises:
            FileNotFoundError: Raised when kity.png is missing.
        """
        src = self._public_dir / "kity.png"
        if not src.exists():
            raise FileNotFoundError(str(src))

        dst = self._public_dir / "kity.ico"
        raw = Image.open(src).convert("RGBA")

        max_side = max(raw.size[0], raw.size[1])
        square = Image.new("RGBA", (max_side, max_side), (0, 0, 0, 0))
        left = (max_side - raw.size[0]) // 2
        top = (max_side - raw.size[1]) // 2
        square.paste(raw, (left, top), raw)

        sizes = [(16, 16), (32, 32), (48, 48), (256, 256)]
        png_blobs: list[tuple[tuple[int, int], bytes]] = []
        for size in sizes:
            img = square.resize(size, resample=Image.Resampling.LANCZOS)
            bio = BytesIO()
            img.save(bio, format="PNG")
            png_blobs.append((size, bio.getvalue()))

        self._write_ico(dst, png_blobs)
        return dst

    def verify(self, ico_path: Path) -> list[tuple[int, int]]:
        """
        Verify frames inside an ico file.

        Args:
            ico_path: Ico file path.

        Returns:
            list[tuple[int, int]]: List of frame sizes.

        Raises:
            FileNotFoundError: Raised when ico file is missing.
        """
        if not ico_path.exists():
            raise FileNotFoundError(str(ico_path))

        with ico_path.open("rb") as f:
            data = f.read()
        if len(data) < 6:
            return []
        reserved, ico_type, count = struct.unpack_from("<HHH", data, 0)
        if reserved != 0 or ico_type != 1 or count <= 0:
            return []

        sizes: list[tuple[int, int]] = []
        offset = 6
        for _ in range(count):
            if offset + 16 > len(data):
                break
            width, height, _, _, _, _, _, _ = struct.unpack_from("<BBBBHHII", data, offset)
            sizes.append((256 if width == 0 else width, 256 if height == 0 else height))
            offset += 16
        return sizes

    @staticmethod
    def _write_ico(dst: Path, png_blobs: list[tuple[tuple[int, int], bytes]]) -> None:
        """
        Write ICO file containing PNG images.

        Args:
            dst: Output ico path.
            png_blobs: List of ((w, h), png_bytes).

        Returns:
            None.

        Raises:
            ValueError: Raised when input is invalid.
        """
        if not png_blobs:
            raise ValueError("png_blobs is empty")

        count = len(png_blobs)
        header_size = 6 + 16 * count
        offset = header_size

        entries: list[bytes] = []
        images: list[bytes] = []

        for (w, h), blob in png_blobs:
            width_byte = 0 if w >= 256 else w
            height_byte = 0 if h >= 256 else h
            bytes_in_res = len(blob)
            entry = struct.pack(
                "<BBBBHHII",
                width_byte,
                height_byte,
                0,
                0,
                1,
                32,
                bytes_in_res,
                offset,
            )
            entries.append(entry)
            images.append(blob)
            offset += bytes_in_res

        with dst.open("wb") as f:
            f.write(struct.pack("<HHH", 0, 1, count))
            for entry in entries:
                f.write(entry)
            for blob in images:
                f.write(blob)

    @staticmethod
    def main() -> None:
        """
        Script entry.

        Args:
            None.

        Returns:
            None.

        Raises:
            SystemExit: Exit with non-zero on failure.
        """
        public_dir = Path(__file__).resolve().parents[1] / "public"
        builder = KityIcoBuilder(public_dir)
        ico_path = builder.build()
        frames = builder.verify(ico_path)
        print(str(ico_path))
        print(f"frames={frames}")


if __name__ == "__main__":
    KityIcoBuilder.main()

