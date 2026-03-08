# Python Computer Vision Code for Enhanced Camera Guidance

This document provides Python code examples for implementing advanced face detection and camera positioning guidance that could extend the web application's capabilities.

## Overview

The web application includes a camera studio feature with basic face detection simulation. For production use, you can implement proper face detection using Python with OpenCV and face_recognition libraries.

## Prerequisites

```bash
pip install opencv-python face_recognition numpy mediapipe
```

## 1. Real-Time Face Detection and Positioning

```python
import cv2
import face_recognition
import numpy as np
from typing import Tuple, Dict

class FacePositionAnalyzer:
    """Analyzes face position relative to camera frame"""
    
    def __init__(self, target_distance_cm=90, tolerance_percent=15):
        self.cap = None
        self.target_distance = target_distance_cm
        self.tolerance = tolerance_percent / 100.0
        
    def start_camera(self, camera_index=0):
        """Initialize camera capture"""
        self.cap = cv2.VideoCapture(camera_index)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
    def analyze_frame(self, frame) -> Dict:
        """
        Analyze face position in frame
        Returns dict with positioning feedback
        """
        # Convert to RGB for face_recognition
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Detect face locations
        face_locations = face_recognition.face_locations(rgb_frame)
        
        if not face_locations:
            return {
                "face_detected": False,
                "status": "no-face",
                "feedback": "Face not detected - adjust position or lighting"
            }
        
        # Get first face (primary subject)
        top, right, bottom, left = face_locations[0]
        face_width = right - left
        face_height = bottom - top
        face_center_x = (left + right) // 2
        face_center_y = (top + bottom) // 2
        
        # Frame dimensions
        frame_height, frame_width = frame.shape[:2]
        frame_center_x = frame_width // 2
        frame_center_y = frame_height // 2
        
        # Ideal face size (25% of frame width)
        ideal_face_width = frame_width * 0.25
        size_ratio = face_width / ideal_face_width
        
        # Calculate positioning feedback
        feedback = self._generate_feedback(
            face_center_x, face_center_y,
            frame_center_x, frame_center_y,
            size_ratio
        )
        
        return {
            "face_detected": True,
            "status": "perfect" if feedback["is_perfect"] else "adjusting",
            "feedback": feedback["message"],
            "face_location": (top, right, bottom, left),
            "distance_status": feedback["distance"],
            "horizontal_alignment": feedback["horizontal"],
            "vertical_alignment": feedback["vertical"]
        }
    
    def _generate_feedback(self, face_x, face_y, center_x, center_y, size_ratio):
        """Generate human-readable positioning feedback"""
        
        # Distance calculations
        horizontal_diff = face_x - center_x
        vertical_diff = face_y - center_y
        
        # Check if perfectly positioned
        is_centered = abs(horizontal_diff) < 50 and abs(vertical_diff) < 40
        is_right_distance = 0.9 < size_ratio < 1.1
        is_perfect = is_centered and is_right_distance
        
        # Generate feedback message
        if is_perfect:
            message = "Perfect! Hold this position"
        elif abs(horizontal_diff) > 100:
            message = f"Move {'left' if horizontal_diff > 0 else 'right'}"
        elif abs(vertical_diff) > 80:
            message = f"Move {'down' if vertical_diff > 0 else 'up'}"
        elif size_ratio < 0.85:
            message = "Move closer to the camera"
        elif size_ratio > 1.15:
            message = "Move back from the camera"
        else:
            message = "Almost there, slight adjustment needed"
        
        return {
            "is_perfect": is_perfect,
            "message": message,
            "distance": "perfect" if is_right_distance else ("too-close" if size_ratio > 1.1 else "too-far"),
            "horizontal": "center" if abs(horizontal_diff) < 50 else ("left" if horizontal_diff < 0 else "right"),
            "vertical": "center" if abs(vertical_diff) < 40 else ("top" if vertical_diff < 0 else "bottom")
        }
    
    def draw_guides(self, frame, analysis_result):
        """Draw positioning guides on frame"""
        height, width = frame.shape[:2]
        center_x, center_y = width // 2, height // 2
        ideal_size = int(width * 0.25)
        
        # Draw center crosshairs
        cv2.line(frame, (0, center_y), (width, center_y), (255, 255, 255), 1)
        cv2.line(frame, (center_x, 0), (center_x, height), (255, 255, 255), 1)
        
        # Draw ideal face box
        box_color = (255, 255, 255, 100)
        cv2.rectangle(frame,
                     (center_x - ideal_size//2, center_y - ideal_size//2),
                     (center_x + ideal_size//2, center_y + ideal_size//2),
                     box_color, 2)
        
        # Draw detected face box if present
        if analysis_result["face_detected"]:
            top, right, bottom, left = analysis_result["face_location"]
            color = (0, 255, 0) if analysis_result["status"] == "perfect" else (0, 165, 255)
            cv2.rectangle(frame, (left, top), (right, bottom), color, 3)
        
        # Display feedback text
        cv2.putText(frame, analysis_result["feedback"],
                   (20, height - 30), cv2.FONT_HERSHEY_SIMPLEX,
                   0.8, (255, 255, 255), 2)
        
        return frame

## 2. Head Pose Estimation

```python
import mediapipe as mp

class HeadPoseEstimator:
    """Estimate head orientation using MediaPipe"""
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    def estimate_pose(self, frame):
        """
        Estimate head pose angles (pitch, yaw, roll)
        Returns angles in degrees
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return None
        
        face_landmarks = results.multi_face_landmarks[0]
        
        # Extract key facial landmarks
        nose_tip = face_landmarks.landmark[1]
        chin = face_landmarks.landmark[152]
        left_eye = face_landmarks.landmark[33]
        right_eye = face_landmarks.landmark[263]
        
        # Calculate angles (simplified 2D approach)
        # For production, use full 3D pose estimation with camera calibration
        
        # Yaw (left-right rotation)
        eye_center_x = (left_eye.x + right_eye.x) / 2
        yaw = (nose_tip.x - eye_center_x) * 90  # Approximate
        
        # Pitch (up-down tilt)
        pitch = (nose_tip.y - chin.y) * 60  # Approximate
        
        # Provide feedback based on pose
        feedback = self._pose_feedback(yaw, pitch)
        
        return {
            "yaw": yaw,
            "pitch": pitch,
            "feedback": feedback,
            "is_frontal": abs(yaw) < 15 and abs(pitch) < 15
        }
    
    def _pose_feedback(self, yaw, pitch):
        """Generate feedback for head pose"""
        if abs(yaw) < 10 and abs(pitch) < 10:
            return "Perfect head angle"
        elif abs(yaw) > 25:
            return f"Turn your head {'left' if yaw > 0 else 'right'}"
        elif abs(pitch) > 20:
            return f"Look {'down' if pitch > 0 else 'up'} slightly"
        else:
            return "Almost centered"

## 3. Shot Type Verification

```python
class ShotTypeVerifier:
    """Verify if framing matches director's requirements"""
    
    SHOT_TYPE_RATIOS = {
        "extreme-close-up": (0.6, 1.0),  # Face fills 60-100% of frame
        "close-up": (0.4, 0.6),           # Face fills 40-60% of frame
        "medium-shot": (0.2, 0.4),        # Face fills 20-40% of frame
        "wide-shot": (0.1, 0.2),          # Face fills 10-20% of frame
    }
    
    def verify_shot(self, face_width, frame_width, required_shot_type):
        """
        Verify if current framing matches required shot type
        """
        ratio = face_width / frame_width
        min_ratio, max_ratio = self.SHOT_TYPE_RATIOS.get(
            required_shot_type, (0.2, 0.4)
        )
        
        is_correct = min_ratio <= ratio <= max_ratio
        
        if not is_correct:
            if ratio < min_ratio:
                feedback = f"Move closer for {required_shot_type}"
            else:
                feedback = f"Move back for {required_shot_type}"
        else:
            feedback = f"Perfect {required_shot_type} framing"
        
        return {
            "is_correct": is_correct,
            "current_ratio": ratio,
            "feedback": feedback
        }

## 4. Complete Camera Direction System

```python
class CameraDirectionSystem:
    """Integrated system for real-time camera direction"""
    
    def __init__(self):
        self.position_analyzer = FacePositionAnalyzer()
        self.pose_estimator = HeadPoseEstimator()
        self.shot_verifier = ShotTypeVerifier()
        
    def analyze_complete_frame(self, frame, direction_requirements):
        """
        Complete analysis against director requirements
        
        Args:
            frame: Camera frame
            direction_requirements: Dict with camera_angle, shot_type, positioning
        """
        # Face position analysis
        position_result = self.position_analyzer.analyze_frame(frame)
        
        if not position_result["face_detected"]:
            return position_result
        
        # Head pose estimation
        pose_result = self.pose_estimator.estimate_pose(frame)
        
        # Shot type verification
        face_loc = position_result["face_location"]
        top, right, bottom, left = face_loc
        face_width = right - left
        frame_width = frame.shape[1]
        
        shot_result = self.shot_verifier.verify_shot(
            face_width, frame_width,
            direction_requirements.get("shot_type", "medium-shot")
        )
        
        # Combine all feedback
        all_correct = (
            position_result["status"] == "perfect" and
            pose_result["is_frontal"] and
            shot_result["is_correct"]
        )
        
        primary_feedback = self._prioritize_feedback(
            position_result, pose_result, shot_result
        )
        
        return {
            "ready_to_record": all_correct,
            "primary_feedback": primary_feedback,
            "position": position_result,
            "pose": pose_result,
            "shot": shot_result
        }
    
    def _prioritize_feedback(self, position, pose, shot):
        """Prioritize which feedback to show user"""
        if not position["face_detected"]:
            return position["feedback"]
        elif position["status"] != "perfect":
            return position["feedback"]
        elif not pose["is_frontal"]:
            return pose["feedback"]
        elif not shot["is_correct"]:
            return shot["feedback"]
        else:
            return "Perfect! Ready to record"

## 5. Usage Example

```python
def main():
    """Example usage of the camera direction system"""
    
    # Initialize system
    system = CameraDirectionSystem()
    system.position_analyzer.start_camera(0)
    
    # Direction requirements from your video project
    requirements = {
        "camera_angle": "eye-level",
        "shot_type": "medium-shot",
        "positioning": "center frame",
        "distance": "3 feet"
    }
    
    print("Camera Direction System Active")
    print("Press 'q' to quit, 'r' to start recording when ready")
    
    recording = False
    
    while True:
        ret, frame = system.position_analyzer.cap.read()
        if not ret:
            break
        
        # Analyze frame against requirements
        analysis = system.analyze_complete_frame(frame, requirements)
        
        # Draw guides and feedback
        frame_with_guides = system.position_analyzer.draw_guides(
            frame.copy(), analysis["position"]
        )
        
        # Display recording indicator
        if recording:
            cv2.circle(frame_with_guides, (30, 30), 15, (0, 0, 255), -1)
            cv2.putText(frame_with_guides, "REC", (60, 40),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Show frame
        cv2.imshow('Camera Direction System', frame_with_guides)
        
        # Handle keyboard input
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('r') and analysis["ready_to_record"]:
            recording = not recording
            print("Recording:" if recording else "Stopped recording")
    
    # Cleanup
    system.position_analyzer.cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
```

## 6. Integration with Web Application

To integrate this Python code with your web application:

### Option 1: WebSocket Server
Create a Python WebSocket server that streams analysis results to the browser:

```python
import asyncio
import websockets
import json
import base64

async def camera_server(websocket, path):
    system = CameraDirectionSystem()
    system.position_analyzer.start_camera(0)
    
    async for message in websocket:
        data = json.loads(message)
        requirements = data.get("requirements", {})
        
        ret, frame = system.position_analyzer.cap.read()
        if ret:
            analysis = system.analyze_complete_frame(frame, requirements)
            
            # Send analysis back to browser
            await websocket.send(json.dumps({
                "analysis": analysis,
                "timestamp": time.time()
            }))

# Start server
start_server = websockets.serve(camera_server, "localhost", 8765)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

### Option 2: REST API with Flask
```python
from flask import Flask, request, jsonify
import cv2

app = Flask(__name__)
system = CameraDirectionSystem()

@app.route('/analyze_frame', methods=['POST'])
def analyze_frame():
    # Receive frame from browser
    frame_data = request.json['frame']
    requirements = request.json['requirements']
    
    # Decode frame
    frame = decode_base64_frame(frame_data)
    
    # Analyze
    analysis = system.analyze_complete_frame(frame, requirements)
    
    return jsonify(analysis)

if __name__ == '__main__':
    app.run(port=5000)
```

## Notes

- The current web application uses browser-based WebRTC for camera access
- For production face detection, consider using TensorFlow.js or face-api.js in the browser
- The Python code above provides more accurate detection but requires server-side processing
- Consider privacy implications when processing video frames server-side
