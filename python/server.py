"""
Python Service for SyncStream Pro
Provides advanced network monitoring, video processing, and system analysis
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
import json
import os
import cv2
import numpy as np
from PIL import Image
import base64
import io
from network_monitor import NetworkMonitor, NetworkQualityAnalyzer

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize monitors
network_monitor = NetworkMonitor()
quality_analyzer = NetworkQualityAnalyzer()

# Start monitoring on server start
network_monitor.start_monitoring()

# Background thread to update quality analyzer
def update_analyzer():
    while True:
        stats = network_monitor.get_all_stats()
        quality_analyzer.add_sample(stats)
        time.sleep(1)

analyzer_thread = threading.Thread(target=update_analyzer, daemon=True)
analyzer_thread.start()


# ============= Network Monitoring APIs =============

@app.route('/api/network/stats', methods=['GET'])
def get_network_stats():
    """Get current network statistics"""
    stats = network_monitor.get_all_stats()
    stats['stability_score'] = quality_analyzer.get_stability_score()
    stats['trend'] = quality_analyzer.get_trend()
    stats['recommendation'] = network_monitor.get_quality_recommendation()
    return jsonify(stats)


@app.route('/api/network/speed-test', methods=['POST'])
def run_speed_test():
    """Run a comprehensive speed test"""
    result = network_monitor.run_speed_test()
    return jsonify(result)


@app.route('/api/network/latency', methods=['POST'])
def test_latency():
    """Test latency to specific hosts"""
    data = request.get_json()
    hosts = data.get('hosts', ['8.8.8.8', '1.1.1.1', 'google.com'])
    result = network_monitor.test_latency(hosts)
    return jsonify(result)


@app.route('/api/network/interfaces', methods=['GET'])
def get_interfaces():
    """Get all network interfaces"""
    interfaces = network_monitor.get_network_interfaces()
    return jsonify(interfaces)


@app.route('/api/network/bandwidth-usage', methods=['GET'])
def get_bandwidth_usage():
    """Get processes using bandwidth"""
    processes = network_monitor.analyze_bandwidth_usage()
    return jsonify({'processes': processes})


@app.route('/api/network/buffer-prediction', methods=['POST'])
def predict_buffering():
    """Predict buffering based on video bitrate"""
    data = request.get_json()
    bitrate = data.get('bitrate', 8)  # Default 8 Mbps
    prediction = network_monitor.predict_buffer_health(bitrate)
    return jsonify(prediction)


# ============= Video Processing APIs =============

class VideoProcessor:
    @staticmethod
    def extract_thumbnail(video_path, timestamp=1.0):
        """Extract thumbnail from video at specific timestamp"""
        try:
            cap = cv2.VideoCapture(video_path)
            cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
            success, frame = cap.read()
            cap.release()
            
            if success:
                # Convert to RGB and resize
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame = cv2.resize(frame, (320, 180))
                
                # Convert to base64
                img = Image.fromarray(frame)
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=85)
                img_str = base64.b64encode(buffer.getvalue()).decode()
                
                return {'success': True, 'thumbnail': f'data:image/jpeg;base64,{img_str}'}
            else:
                return {'success': False, 'error': 'Failed to extract frame'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_video_info(video_path):
        """Get detailed video information"""
        try:
            cap = cv2.VideoCapture(video_path)
            
            info = {
                'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                'fps': cap.get(cv2.CAP_PROP_FPS),
                'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
                'duration': cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS),
                'codec': int(cap.get(cv2.CAP_PROP_FOURCC))
            }
            
            # Calculate bitrate estimate
            file_size = os.path.getsize(video_path) * 8  # Convert to bits
            info['bitrate'] = file_size / info['duration'] / 1000000  # Mbps
            
            cap.release()
            return {'success': True, 'info': info}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def optimize_for_streaming(video_path, quality='720p'):
        """Optimize video for streaming (returns settings, doesn't re-encode)"""
        quality_presets = {
            '360p': {'width': 640, 'height': 360, 'bitrate': '1M', 'crf': 30},
            '480p': {'width': 854, 'height': 480, 'bitrate': '2.5M', 'crf': 28},
            '720p': {'width': 1280, 'height': 720, 'bitrate': '5M', 'crf': 25},
            '1080p': {'width': 1920, 'height': 1080, 'bitrate': '8M', 'crf': 23},
            '1440p': {'width': 2560, 'height': 1440, 'bitrate': '16M', 'crf': 22},
            '4k': {'width': 3840, 'height': 2160, 'bitrate': '25M', 'crf': 20}
        }
        
        preset = quality_presets.get(quality, quality_presets['720p'])
        
        # FFmpeg command for optimized streaming
        ffmpeg_cmd = f"""ffmpeg -i "{video_path}" \
            -c:v libx264 -preset fast -crf {preset['crf']} \
            -s {preset['width']}x{preset['height']} \
            -b:v {preset['bitrate']} -maxrate {preset['bitrate']} \
            -bufsize 2M -movflags +faststart \
            -c:a aac -b:a 128k \
            output.mp4"""
        
        return {
            'success': True,
            'preset': preset,
            'command': ffmpeg_cmd,
            'estimated_size_reduction': f"{100 - (preset['crf'] * 2)}%"
        }


video_processor = VideoProcessor()


@app.route('/api/video/thumbnail', methods=['POST'])
def extract_thumbnail():
    """Extract thumbnail from video"""
    data = request.get_json()
    video_path = data.get('path')
    timestamp = data.get('timestamp', 1.0)
    
    if not video_path or not os.path.exists(video_path):
        return jsonify({'success': False, 'error': 'Invalid video path'}), 400
    
    result = video_processor.extract_thumbnail(video_path, timestamp)
    return jsonify(result)


@app.route('/api/video/info', methods=['POST'])
def get_video_info():
    """Get video information"""
    data = request.get_json()
    video_path = data.get('path')
    
    if not video_path or not os.path.exists(video_path):
        return jsonify({'success': False, 'error': 'Invalid video path'}), 400
    
    result = video_processor.get_video_info(video_path)
    return jsonify(result)


@app.route('/api/video/optimize', methods=['POST'])
def optimize_video():
    """Get optimization settings for video"""
    data = request.get_json()
    video_path = data.get('path')
    quality = data.get('quality', '720p')
    
    if not video_path:
        return jsonify({'success': False, 'error': 'Invalid video path'}), 400
    
    result = video_processor.optimize_for_streaming(video_path, quality)
    return jsonify(result)


# ============= System Monitoring APIs =============

@app.route('/api/system/resources', methods=['GET'])
def get_system_resources():
    """Get system resource usage"""
    import psutil
    
    resources = {
        'cpu': {
            'percent': psutil.cpu_percent(interval=1),
            'cores': psutil.cpu_count(),
            'frequency': psutil.cpu_freq().current if psutil.cpu_freq() else 0
        },
        'memory': {
            'percent': psutil.virtual_memory().percent,
            'available': psutil.virtual_memory().available / (1024**3),  # GB
            'total': psutil.virtual_memory().total / (1024**3),  # GB
            'used': psutil.virtual_memory().used / (1024**3)  # GB
        },
        'disk': {
            'percent': psutil.disk_usage('/').percent,
            'free': psutil.disk_usage('/').free / (1024**3),  # GB
            'total': psutil.disk_usage('/').total / (1024**3)  # GB
        },
        'network_adapters': len(psutil.net_if_addrs()),
        'processes': len(psutil.pids())
    }
    
    return jsonify(resources)


@app.route('/api/system/optimize-settings', methods=['GET'])
def get_optimized_settings():
    """Get optimized settings based on system capabilities"""
    import psutil
    
    cpu_cores = psutil.cpu_count()
    ram_gb = psutil.virtual_memory().total / (1024**3)
    
    # Determine optimal settings
    if cpu_cores >= 8 and ram_gb >= 16:
        profile = 'high_performance'
        settings = {
            'max_quality': '4k',
            'max_users': 50,
            'buffer_size': '10MB',
            'encoding_preset': 'fast'
        }
    elif cpu_cores >= 4 and ram_gb >= 8:
        profile = 'balanced'
        settings = {
            'max_quality': '1080p',
            'max_users': 25,
            'buffer_size': '5MB',
            'encoding_preset': 'medium'
        }
    else:
        profile = 'power_saver'
        settings = {
            'max_quality': '720p',
            'max_users': 10,
            'buffer_size': '2MB',
            'encoding_preset': 'ultrafast'
        }
    
    return jsonify({
        'profile': profile,
        'settings': settings,
        'system': {
            'cpu_cores': cpu_cores,
            'ram_gb': round(ram_gb, 1)
        }
    })


# ============= Health Check =============

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'SyncStream Python Service',
        'version': '1.0.0',
        'monitors': {
            'network': 'active',
            'video': 'ready',
            'system': 'active'
        }
    })


if __name__ == '__main__':
    print("""
    +===========================================+
    |   SyncStream Pro Python Service v1.0     |
    |   Advanced Monitoring & Processing       |
    +===========================================+
    
    Starting services...
    - Network Monitor: Active
    - Video Processor: Ready
    - System Monitor: Active
    
    API Server running on http://localhost:5555
    """)
    
    app.run(host='0.0.0.0', port=5555, debug=False)
