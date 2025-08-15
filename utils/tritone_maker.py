import os
from PIL import Image
import numpy as np


def change_image_colors(
    input_dir="./img", output_dir="./img/tritone", colors=None, contrast=1.5
):
    """
    Apply color filter to images using specified colors while preserving transparency.

    Args:
        input_dir: Directory containing input images
        output_dir: Directory to save processed images
        colors: List of RGB tuples for the colors to use as filter
        contrast: Contrast multiplier (1.0 = no change, >1.0 = more contrast)
    """
    if colors is None:
        # Default colors - you can change these
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]  # Red, Green, Blue

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Get all image files
    image_extensions = (".jpg", ".jpeg", ".png", ".bmp", ".tiff")

    for filename in os.listdir(input_dir):
        if filename.lower().endswith(image_extensions):
            input_path = os.path.join(input_dir, filename)

            try:
                # Open image and preserve alpha channel
                img = Image.open(input_path)

                # Convert to RGBA to ensure alpha channel exists
                if img.mode != "RGBA":
                    img = img.convert("RGBA")

                img_array = np.array(img)

                # Extract RGB and alpha channels
                rgb_array = img_array[..., :3]
                alpha_channel = img_array[..., 3]

                # Convert to grayscale for processing (only non-transparent pixels)
                gray = np.dot(rgb_array, [0.299, 0.587, 0.114])

                # Normalize grayscale to 0-1 range
                gray_normalized = gray / 255.0

                # Apply contrast adjustment
                gray_normalized = np.clip(
                    (gray_normalized - 0.5) * contrast + 0.5, 0, 1
                )

                # Apply color mapping based on intensity
                colored_img = np.zeros_like(img_array)

                # Map grayscale intensities to color gradient
                num_colors = len(colors)
                for y in range(img_array.shape[0]):
                    for x in range(img_array.shape[1]):
                        # Only process non-transparent pixels
                        if alpha_channel[y, x] > 0:
                            intensity = gray_normalized[y, x]

                            # Map intensity to color index
                            color_index = min(
                                int(intensity * (num_colors - 1)), num_colors - 2
                            )
                            next_color_index = min(color_index + 1, num_colors - 1)

                            # Interpolate between colors
                            local_t = (intensity * (num_colors - 1)) - color_index

                            for channel in range(3):
                                color1 = colors[color_index][channel]
                                color2 = colors[next_color_index][channel]
                                colored_img[y, x, channel] = (
                                    color1 + (color2 - color1) * local_t
                                )

                        # Preserve the original alpha channel
                        colored_img[y, x, 3] = alpha_channel[y, x]

                # Convert back to PIL Image and save
                result_img = Image.fromarray(colored_img.astype(np.uint8), "RGBA")

                # Create output filename
                name, ext = os.path.splitext(filename)
                output_filename = f"{name}.png"
                output_path = os.path.join(output_dir, output_filename)

                result_img.save(output_path)
                print(f"Saved: {output_filename}")

            except Exception as e:
                print(f"Error processing {filename}: {e}")


# Example usage
if __name__ == "__main__":
    # You can customize these colors (R, G, B values 0-255)
    custom_colors = [
        (255, 80, 105),  # #ff5069
        (49, 102, 217),  # #3166d9
        (255, 217, 67),  # #ffd943
    ]

    change_image_colors(colors=custom_colors, contrast=1.5)
