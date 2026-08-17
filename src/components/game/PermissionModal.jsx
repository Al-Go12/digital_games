import { Button } from "../ui/Button";

export function PermissionModal({ 
  title, 
  description, 
  onGrant, 
  onDeny, 
  isDenied 
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>
        
        <div className="space-y-3">
          {!isDenied ? (
            <Button variant="primary" className="w-full" onClick={onGrant}>
              Enable Access
            </Button>
          ) : (
            <p className="text-red-500 font-medium mb-4 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
              Access was denied or is unsupported.
            </p>
          )}
          
          <Button variant="ghost" className="w-full" onClick={onDeny}>
            {isDenied ? "Use Demo Mode" : "No Thanks (Demo Mode)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
