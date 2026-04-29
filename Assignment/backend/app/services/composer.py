from PIL import Image, ImageStat
import os

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

OUTPUT_FORMATS = {
    "post_square":   (1080, 1080),
    "post_portrait": (1080, 1350),
    "story":         (1080, 1920),
}

LOGO_BASE_RATIO     = 0.15
LOGO_MIN_RATIO      = 0.08
LOGO_MAX_RATIO      = 0.18
CORNER_SAMPLE_RATIO = 0.25


def fit_background_to_canvas(bg: Image.Image, canvas_w: int, canvas_h: int) -> Image.Image:
    bg_ratio     = bg.width / bg.height
    canvas_ratio = canvas_w / canvas_h

    if bg_ratio > canvas_ratio:
        new_h = canvas_h
        new_w = int(bg.width * (canvas_h / bg.height))
    else:
        new_w = canvas_w
        new_h = int(bg.height * (canvas_w / bg.width))

    bg   = bg.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - canvas_w) // 2
    top  = (new_h - canvas_h) // 2
    return bg.crop((left, top, left + canvas_w, top + canvas_h))


def scale_panel_to_canvas(panel: Image.Image, canvas_w: int, canvas_h: int) -> Image.Image:
    target_w = int(canvas_w * 0.80)
    ratio    = target_w / panel.width
    target_h = int(panel.height * ratio)

    max_h = int(canvas_h * 0.40)
    if target_h > max_h:
        ratio    = max_h / panel.height
        target_w = int(panel.width * ratio)
        target_h = max_h

    return panel.resize((target_w, target_h), Image.LANCZOS)


def auto_position_panel(canvas_w: int, canvas_h: int, panel_w: int, panel_h: int):
    x = (canvas_w - panel_w) // 2
    y = int(canvas_h * 0.90) - panel_h
    y = max(y, canvas_h // 2)
    return x, y


def logo_size_ratio(canvas_w: int, canvas_h: int) -> float:
    ratio = LOGO_BASE_RATIO * (canvas_w / canvas_h)
    return max(LOGO_MIN_RATIO, min(LOGO_MAX_RATIO, ratio))


def compute_corner_variance(bg: Image.Image, canvas_w: int, canvas_h: int) -> dict:
    rw = int(canvas_w * CORNER_SAMPLE_RATIO)
    rh = int(canvas_h * CORNER_SAMPLE_RATIO)

    regions = {
        "top_left":     (0,            0,            rw,       rh),
        "top_right":    (canvas_w - rw, 0,           canvas_w, rh),
        "bottom_left":  (0,            canvas_h - rh, rw,      canvas_h),
        "bottom_right": (canvas_w - rw, canvas_h - rh, canvas_w, canvas_h),
    }

    variances = {}
    for corner, box in regions.items():
        crop = bg.crop(box).convert("L")
        variances[corner] = ImageStat.Stat(crop).var[0]

    return variances


def _logo_box_for_corner(corner: str, logo_w: int, logo_h: int,
                         padding: int, canvas_w: int, canvas_h: int):
    if corner == "top_left":
        x = padding
        y = padding
    elif corner == "top_right":
        x = canvas_w - logo_w - padding
        y = padding
    elif corner == "bottom_left":
        x = padding
        y = canvas_h - logo_h - padding
    else:
        x = canvas_w - logo_w - padding
        y = canvas_h - logo_h - padding
    return (x, y, x + logo_w, y + logo_h)


def _rectangles_overlap(a, b) -> bool:
    return a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1]


def place_logo_auto(canvas: Image.Image, logo: Image.Image,
                    background_ref: Image.Image, padding: int,
                    panel_bbox) -> Image.Image:
    canvas_w, canvas_h = canvas.size

    logo_w = int(canvas_w * logo_size_ratio(canvas_w, canvas_h))
    logo_w = min(logo_w, canvas_w - 2 * padding)
    ratio  = logo_w / logo.width
    logo   = logo.resize((logo_w, int(logo.height * ratio)), Image.LANCZOS)

    variances = compute_corner_variance(background_ref, canvas_w, canvas_h)
    ranked    = sorted(variances, key=lambda k: variances[k])

    chosen_corner = None
    for corner in ranked:
        logo_box = _logo_box_for_corner(corner, logo.width, logo.height, padding, canvas_w, canvas_h)
        if panel_bbox is None or not _rectangles_overlap(logo_box, panel_bbox):
            chosen_corner = corner
            break

    if chosen_corner is None:
        chosen_corner = "top_right"

    x, y, _, _ = _logo_box_for_corner(chosen_corner, logo.width, logo.height, padding, canvas_w, canvas_h)
    canvas.paste(logo, (x, y), mask=logo)
    return canvas


def compose_creative(
    job_id: str,
    dealership_name: str,
    background_path: str,
    output_format: str = "post_square",
    panel_path: str = None,
    logo_path: str = None,
) -> str:
    canvas_w, canvas_h = OUTPUT_FORMATS.get(output_format, (1080, 1080))
    padding = int(canvas_w * 0.028)

    bg     = Image.open(background_path).convert("RGBA")
    canvas = fit_background_to_canvas(bg, canvas_w, canvas_h)

    background_ref = canvas.copy()

    panel_bbox = None
    if panel_path and os.path.exists(panel_path):
        panel      = Image.open(panel_path).convert("RGBA")
        panel      = scale_panel_to_canvas(panel, canvas_w, canvas_h)
        px, py     = auto_position_panel(canvas_w, canvas_h, panel.width, panel.height)
        canvas.paste(panel, (px, py), mask=panel)
        panel_bbox = (px, py, px + panel.width, py + panel.height)

    if logo_path and os.path.exists(logo_path):
        logo   = Image.open(logo_path).convert("RGBA")
        canvas = place_logo_auto(canvas, logo, background_ref, padding, panel_bbox)

    safe_name   = dealership_name.replace(" ", "_").lower()
    output_path = os.path.join(OUTPUT_DIR, f"{job_id}_{safe_name}_{output_format}.jpg")

    canvas.convert("RGB").save(output_path, quality=95)
    return output_path
