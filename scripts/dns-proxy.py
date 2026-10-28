import socket
import select
import threading
import urllib.request
import json
import sys

DNS_CACHE = {}

def resolve_doh(hostname):
    if hostname in DNS_CACHE:
        return DNS_CACHE[hostname]
    try:
        # Resolve via Google DNS over HTTPS
        url = f"https://dns.google/resolve?name={hostname}&type=A"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            for ans in data.get('Answer', []):
                if ans.get('type') == 1 and ans.get('data'):
                    ip = ans['data']
                    DNS_CACHE[hostname] = ip
                    print(f"[DoH] Resolved {hostname} -> {ip}")
                    return ip
    except Exception as e:
        print(f"[DoH Error] {hostname}: {e}")
    
    # Fallback to standard DNS
    try:
        ip = socket.gethostbyname(hostname)
        DNS_CACHE[hostname] = ip
        return ip
    except Exception:
        return hostname

def handle_client(client_socket):
    try:
        req = b""
        while b"\r\n\r\n" not in req:
            chunk = client_socket.recv(4096)
            if not chunk:
                break
            req += chunk
        
        lines = req.decode('latin1', errors='ignore').split('\r\n')
        first_line = lines[0] if lines else ""
        parts = first_line.split()
        if len(parts) < 2:
            client_socket.close()
            return
        
        method, target = parts[0], parts[1]
        
        if method.upper() == 'CONNECT':
            host, port_str = target.split(':')
            port = int(port_str)
            resolved_ip = resolve_doh(host)
            
            target_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            target_socket.connect((resolved_ip, port))
            
            client_socket.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
            
            # Forward data bidirectionally
            sockets = [client_socket, target_socket]
            while True:
                r, _, _ = select.select(sockets, [], [], 30)
                if not r:
                    break
                for s in r:
                    data = s.recv(8192)
                    if not data:
                        return
                    if s is client_socket:
                        target_socket.sendall(data)
                    else:
                        client_socket.sendall(data)
        else:
            client_socket.close()
    except Exception as e:
        pass
    finally:
        try:
            client_socket.close()
        except:
            pass

def run_proxy(port=8888):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('127.0.0.1', port))
    server.listen(100)
    print(f"[*] DoH Proxy listening on 127.0.0.1:{port}")
    sys.stdout.flush()
    while True:
        client, addr = server.accept()
        t = threading.Thread(target=handle_client, args=(client,), daemon=True)
        t.start()

if __name__ == '__main__':
    run_proxy()
