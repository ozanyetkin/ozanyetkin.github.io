#!/usr/bin/env python3
"""
Script to create pixel art from an image by averaging blocks of pixels.
Reduces image to larger pixel blocks (e.g., 16x16) for a true pixel art effect.
"""

from PIL import Image
import numpy as np
import sys
import os

# Ensure PIL is available
try:
    from PIL import Image
except ImportError:
    print("Error: Pillow library not found.")
    print("Please install it with: pip install Pillow")
    sys.exit(1)


def pixelate_image(input_path, output_path=None, block_size=16, scale_up=True):
    """
    Create pixel art by averaging blocks of pixels.

    Args:
        input_path: Path to input PNG image
        output_path: Path to save output image (optional)
        block_size: Size of each pixel block (default: 16)
        scale_up: If True, scale back up to original size (default: True)
    """
    # Load the image
    img = Image.open(input_path)

    # Convert to RGBA if not already
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    # Get image dimensions
    width, height = img.size

    print(f"  Original size: {width}x{height}")

    # Calculate new dimensions (downscaled)
    new_width = width // block_size
    new_height = height // block_size

    print(f"  Pixelated grid: {new_width}x{new_height} blocks")

    # First, resize down to create the pixelation effect
    # Using BOX filter for clean averaging
    small = img.resize((new_width, new_height), Image.Resampling.BOX)

    if scale_up:
        # Scale back up using nearest neighbor to maintain pixel blocks
        result = small.resize((width, height), Image.Resampling.NEAREST)
        print(f"  Output size: {width}x{height} (scaled back up)")
    else:
        result = small
        print(f"  Output size: {new_width}x{new_height} (small)")

    # Generate output path if not provided
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        suffix = f"_pixelart_{block_size}x{block_size}"
        if not scale_up:
            suffix += "_small"
        output_path = f"{base}{suffix}{ext}"

    # Save the pixel art image
    result.save(output_path, "PNG")

    print(f"✓ Pixel art saved to: {output_path}")

    return output_path


if __name__ == "__main__":
    # Get input path from command line or use default
    if len(sys.argv) > 1:
        input_image = sys.argv[1]
        # Optional: block size as second argument
        block_size = int(sys.argv[2]) if len(sys.argv) > 2 else 16
    else:
        input_image = "img/avatar.png"
        block_size = 16

    # Check if image exists
    if not os.path.exists(input_image):
        print(f"Error: Image not found at {input_image}")
        print("Usage: python pixelate_image.py <input_image.png> [block_size]")
        print("Example: python pixelate_image.py img/profile.png 16")
        sys.exit(1)

    # Analyze the image first
    print("\nImage Analysis:")
    img = Image.open(input_image)
    print(f"  Input: {input_image}")
    print(f"  Mode: {img.mode}")
    print(f"  Format: {img.format}")

    # Create pixelated version
    print(f"\nCreating pixel art with {block_size}x{block_size} blocks...")
    pixelate_image(input_image, block_size=block_size, scale_up=True)

    # Also create a small version (not scaled back up)
    print(f"\nCreating small version...")
    base, ext = os.path.splitext(input_image)
    pixelate_image(
        input_image,
        f"{base}_pixelart_{block_size}x{block_size}_small{ext}",
        block_size=block_size,
        scale_up=False,
    )
