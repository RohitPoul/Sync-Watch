"""
Advanced Network Monitor for SyncStream Pro
Provides detailed network statistics, speed testing, and system monitoring
"""

import psutil
import time
import json
import socket
import struct
import threading
from datetime import datetime
try:
    import speedtest_cli as speedtest
except ImportError:
    try:
        import speedtest
    except ImportError:
        speedtest = None
        print("speedtest not available - speed testing disabled")
try:
    import netifaces
    HAS_NETIFACES = True
except ImportError:
    HAS_NETIFACES = False
    print("netifaces not available - network interface discovery disabled")
    
try:
    from pythonping import ping
    HAS_PYTHONPING = True
except ImportError:
    HAS_PYTHONPING = False
    print("pythonping not available - using basic ping")
import platform
import subprocess


class NetworkMonitor:
    def __init__(self):
        self.stats = {
            'network': {},
            'system': {},
            'connections': [],
            'interfaces': {},
            'speed_test': {},
            'latency': {},
            'packet_loss': 0
        }
        self.monitoring = False
        self.last_bytes = {'sent': 0, 'recv': 0, 'time': time.time()}
        
    def start_monitoring(self):
        """Start continuous network monitoring"""
        self.monitoring = True
        threading.Thread(target=self._monitor_loop, daemon=True).start()
        
    def stop_monitoring(self):
        """Stop network monitoring"""
        self.monitoring = False
        
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.monitoring:
            self.update_network_stats()
            self.update_system_stats()
            self.check_connections()
            time.sleep(1)
            
    def update_network_stats(self):
        """Get current network statistics"""
        net_io = psutil.net_io_counters()
        current_time = time.time()
        
        # Calculate speeds
        time_delta = current_time - self.last_bytes['time']
        if time_delta > 0:
            bytes_sent_per_sec = (net_io.bytes_sent - self.last_bytes['sent']) / time_delta
            bytes_recv_per_sec = (net_io.bytes_recv - self.last_bytes['recv']) / time_delta
            
            self.stats['network'] = {
                'download_speed': bytes_recv_per_sec / (1024 * 1024),  # MB/s
                'upload_speed': bytes_sent_per_sec / (1024 * 1024),    # MB/s
                'download_speed_mbps': bytes_recv_per_sec * 8 / (1024 * 1024),  # Mbps
                'upload_speed_mbps': bytes_sent_per_sec * 8 / (1024 * 1024),    # Mbps
                'total_sent': net_io.bytes_sent / (1024 * 1024 * 1024),  # GB
                'total_recv': net_io.bytes_recv / (1024 * 1024 * 1024),  # GB
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv,
                'errors_in': net_io.errin,
                'errors_out': net_io.errout,
                'drops_in': net_io.dropin,
                'drops_out': net_io.dropout
            }
            
            # Calculate packet loss
            if net_io.packets_sent > 0:
                self.stats['packet_loss'] = ((net_io.errout + net_io.dropout) / net_io.packets_sent) * 100
            
        self.last_bytes = {
            'sent': net_io.bytes_sent,
            'recv': net_io.bytes_recv,
            'time': current_time
        }
        
    def update_system_stats(self):
        """Get system resource statistics"""
        self.stats['system'] = {
            'cpu_percent': psutil.cpu_percent(interval=0.1),
            'memory_percent': psutil.virtual_memory().percent,
            'memory_available': psutil.virtual_memory().available / (1024 * 1024 * 1024),  # GB
            'disk_usage': psutil.disk_usage('/').percent,
            'boot_time': datetime.fromtimestamp(psutil.boot_time()).isoformat()
        }
        
    def check_connections(self):
        """Get active network connections"""
        connections = []
        for conn in psutil.net_connections(kind='inet'):
            if conn.status == 'ESTABLISHED':
                connections.append({
                    'local_addr': f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else None,
                    'remote_addr': f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                    'status': conn.status,
                    'pid': conn.pid
                })
        self.stats['connections'] = connections[:10]  # Limit to 10 connections
        
    def get_network_interfaces(self):
        """Get all network interfaces and their IPs"""
        interfaces = {}
        
        if HAS_NETIFACES:
            for iface_name in netifaces.interfaces():
                iface_data = netifaces.ifaddresses(iface_name)
                if netifaces.AF_INET in iface_data:
                    interfaces[iface_name] = {
                        'ipv4': iface_data[netifaces.AF_INET][0]['addr'],
                        'netmask': iface_data[netifaces.AF_INET][0].get('netmask', 'N/A')
                    }
        else:
            # Fallback: use socket to get basic info
            try:
                hostname = socket.gethostname()
                local_ip = socket.gethostbyname(hostname)
                interfaces['default'] = {
                    'ipv4': local_ip,
                    'netmask': 'N/A'
                }
            except:
                interfaces['error'] = 'Unable to detect interfaces'
                
        self.stats['interfaces'] = interfaces
        return interfaces
        
    def run_speed_test(self):
        """Run a comprehensive speed test"""
        if speedtest is None:
            return {'error': 'Speedtest module not available'}
            
        try:
            st = speedtest.Speedtest()
            st.get_best_server()
            
            # Download speed test
            download_speed = st.download() / (1024 * 1024)  # Convert to Mbps
            
            # Upload speed test
            upload_speed = st.upload() / (1024 * 1024)  # Convert to Mbps
            
            # Get ping
            ping_result = st.results.ping
            
            self.stats['speed_test'] = {
                'download': round(download_speed, 2),
                'upload': round(upload_speed, 2),
                'ping': round(ping_result, 2),
                'server': st.results.server['sponsor'],
                'timestamp': datetime.now().isoformat()
            }
            
            return self.stats['speed_test']
        except Exception as e:
            return {'error': str(e)}
            
    def test_latency(self, hosts=None):
        """Test latency to multiple hosts"""
        if hosts is None:
            hosts = ['8.8.8.8', '1.1.1.1', 'google.com']
            
        latency_results = {}
        
        if HAS_PYTHONPING:
            for host in hosts:
                try:
                    response = ping(host, count=4, timeout=2)
                    latency_results[host] = {
                        'min': response.rtt_min_ms,
                        'max': response.rtt_max_ms,
                        'avg': response.rtt_avg_ms,
                        'packet_loss': response.packet_loss
                    }
                except Exception as e:
                    latency_results[host] = {'error': str(e)}
        else:
            # Fallback: use system ping command
            for host in hosts:
                try:
                    if platform.system() == 'Windows':
                        result = subprocess.run(['ping', '-n', '4', host], 
                                              capture_output=True, text=True, timeout=5)
                    else:
                        result = subprocess.run(['ping', '-c', '4', host], 
                                              capture_output=True, text=True, timeout=5)
                    
                    if result.returncode == 0:
                        # Parse output (basic parsing)
                        output = result.stdout
                        if 'Average' in output or 'avg' in output:
                            latency_results[host] = {'status': 'reachable', 'raw': output[:200]}
                        else:
                            latency_results[host] = {'status': 'reachable'}
                    else:
                        latency_results[host] = {'status': 'unreachable'}
                except Exception as e:
                    latency_results[host] = {'error': str(e)}
                
        self.stats['latency'] = latency_results
        return latency_results
        
    def get_route_table(self):
        """Get routing table information"""
        routes = []
        try:
            if platform.system() == 'Windows':
                result = subprocess.run(['route', 'print'], capture_output=True, text=True)
                routes = result.stdout
            else:
                result = subprocess.run(['ip', 'route'], capture_output=True, text=True)
                routes = result.stdout
        except Exception as e:
            routes = f"Error getting routes: {e}"
        return routes
        
    def analyze_bandwidth_usage(self):
        """Analyze which processes are using the most bandwidth"""
        process_bandwidth = {}
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                connections = proc.connections(kind='inet')
                if connections:
                    process_bandwidth[proc.info['name']] = len(connections)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
                
        # Sort by number of connections
        sorted_processes = sorted(process_bandwidth.items(), key=lambda x: x[1], reverse=True)
        return sorted_processes[:10]  # Top 10 processes
        
    def get_quality_recommendation(self):
        """Recommend video quality based on network conditions"""
        download_mbps = self.stats['network'].get('download_speed_mbps', 0)
        packet_loss = self.stats.get('packet_loss', 0)
        
        if packet_loss > 5:
            return {'quality': '480p', 'reason': 'High packet loss detected'}
        elif download_mbps >= 50:
            return {'quality': '4K', 'bitrate': '25-45 Mbps'}
        elif download_mbps >= 25:
            return {'quality': '1440p', 'bitrate': '16 Mbps'}
        elif download_mbps >= 15:
            return {'quality': '1080p60', 'bitrate': '12 Mbps'}
        elif download_mbps >= 10:
            return {'quality': '1080p', 'bitrate': '8 Mbps'}
        elif download_mbps >= 5:
            return {'quality': '720p', 'bitrate': '5 Mbps'}
        elif download_mbps >= 3:
            return {'quality': '480p', 'bitrate': '2.5 Mbps'}
        else:
            return {'quality': '360p', 'bitrate': '1 Mbps'}
            
    def predict_buffer_health(self, video_bitrate_mbps):
        """Predict if buffering will occur based on current network"""
        download_mbps = self.stats['network'].get('download_speed_mbps', 0)
        
        # Need at least 1.5x the bitrate for smooth playback
        required_speed = video_bitrate_mbps * 1.5
        
        if download_mbps >= required_speed:
            return {
                'status': 'healthy',
                'buffer_time': 0,
                'confidence': min(100, (download_mbps / required_speed) * 50)
            }
        else:
            buffer_time = (required_speed - download_mbps) * 10  # Rough estimate
            return {
                'status': 'buffering_likely',
                'buffer_time': round(buffer_time, 1),
                'confidence': max(0, 100 - buffer_time * 10)
            }
            
    def get_all_stats(self):
        """Get all current statistics"""
        return self.stats


# Network Quality Analyzer
class NetworkQualityAnalyzer:
    def __init__(self):
        self.history = []
        self.max_history = 60  # Keep 60 seconds of history
        
    def add_sample(self, stats):
        """Add a network stats sample to history"""
        self.history.append({
            'timestamp': time.time(),
            'stats': stats
        })
        
        # Keep only recent history
        if len(self.history) > self.max_history:
            self.history.pop(0)
            
    def get_stability_score(self):
        """Calculate network stability score (0-100)"""
        if len(self.history) < 10:
            return 50  # Not enough data
            
        # Calculate variance in speeds
        speeds = [s['stats']['network'].get('download_speed_mbps', 0) for s in self.history[-30:]]
        if not speeds:
            return 50
            
        avg_speed = sum(speeds) / len(speeds)
        variance = sum((s - avg_speed) ** 2 for s in speeds) / len(speeds)
        
        # Lower variance = higher stability
        stability = max(0, min(100, 100 - variance * 2))
        return round(stability, 1)
        
    def get_trend(self):
        """Determine if network is improving or degrading"""
        if len(self.history) < 20:
            return 'stable'
            
        recent = self.history[-10:]
        older = self.history[-20:-10]
        
        recent_avg = sum(s['stats']['network'].get('download_speed_mbps', 0) for s in recent) / len(recent)
        older_avg = sum(s['stats']['network'].get('download_speed_mbps', 0) for s in older) / len(older)
        
        if recent_avg > older_avg * 1.1:
            return 'improving'
        elif recent_avg < older_avg * 0.9:
            return 'degrading'
        else:
            return 'stable'
