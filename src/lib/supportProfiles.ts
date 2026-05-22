export interface ModelGeometry {
  width: number;
  depth: number;
  height: number;
  volume: number;
  triangleCount: number;
}

export function detectModelType(geometry: ModelGeometry): "organic" | "technical" {
  const { width, depth, height, volume, triangleCount } = geometry;
  
  // Height more than 1.5x larger than average width and depth (tall and narrow = figure/statue)
  const avgBase = (width + depth) / 2;
  const isTallAndNarrow = height > avgBase * 1.5;

  // Volume less than 30% of bounding box volume (complex model with many voids)
  const boundingBoxVolume = (width * depth * height) / 1000; // cm3
  const volumeRatio = volume / boundingBoxVolume;
  const isComplexEmpty = volumeRatio < 0.3;

  // Triangle count divided by volume > 0.5 (very complex geometry)
  const complexityRatio = triangleCount / volume;
  const isVeryDetailed = complexityRatio > 0.5;

  if (isTallAndNarrow || isComplexEmpty || isVeryDetailed) {
    return "organic";
  }

  return "technical";
}

export function getSupportProfile(type: "organic" | "technical") {
  if (type === "organic") {
    return {
      support_type: "tree(auto)",
      support_style: "tree_organic",
      support_threshold_angle: "45",
      support_top_z_distance: "0.2",
      support_bottom_z_distance: "0.2",
      support_object_xy_distance: "0.35",
      support_interface_top_layers: "2",
      support_interface_bottom_layers: "2",
      support_interface_pattern: "concentric",
      support_interface_spacing: "0",
      support_base_pattern_spacing: "2.5",
      support_wall_loops: "0",
      dont_support_bridges: "1",
      support_remove_small_overhang: "1",
      tree_support_branch_distance: "4",
      tree_support_branch_diameter: "3",
      tree_support_branch_angle: "45",
      independent_support_layer_height: "1",
    };
  }

  return {
    support_type: "normal(auto)",
    support_style: "grid",
    support_threshold_angle: "35",
    support_top_z_distance: "0.2",
    support_bottom_z_distance: "0.2",
    support_object_xy_distance: "0.5",
    support_interface_top_layers: "3",
    support_interface_bottom_layers: "2",
    support_interface_pattern: "rectilinear",
    support_interface_spacing: "0.15",
    support_base_pattern_spacing: "2.5",
    support_wall_loops: "1",
    dont_support_bridges: "0",
    support_remove_small_overhang: "1",
    independent_support_layer_height: "1",
  };
}
