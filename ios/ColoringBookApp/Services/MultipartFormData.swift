import Foundation

struct MultipartFormData {
    struct Payload {
        let body: Data
        let contentLength: Int
    }

    private let boundary: String
    private var parts: [Data] = []

    init(boundary: String) {
        self.boundary = boundary
    }

    func appendingField(name: String, value: String) -> MultipartFormData {
        var copy = self
        var field = Data()
        field.append("--\(boundary)\r\n".data(using: .utf8)!)
        field.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
        field.append("\(value)\r\n".data(using: .utf8)!)
        copy.parts.append(field)
        return copy
    }

    func appendingFile(url: URL, name: String, fileName: String, mimeType: String) throws -> MultipartFormData {
        var copy = self
        let data = try Data(contentsOf: url)
        var filePart = Data()
        filePart.append("--\(boundary)\r\n".data(using: .utf8)!)
        filePart.append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        filePart.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        filePart.append(data)
        filePart.append("\r\n".data(using: .utf8)!)
        copy.parts.append(filePart)
        return copy
    }

    func build() -> Payload {
        var body = Data()
        for part in parts {
            body.append(part)
        }
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        return Payload(body: body, contentLength: body.count)
    }
}
