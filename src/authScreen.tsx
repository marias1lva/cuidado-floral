import { useState } from "react";
import { Mail, Lock, User, Heart, Flower2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  
  // Estado para gerenciar mensagens de erro (Fluxos de Exceção)
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Limpa erros anteriores ao tentar logar
    
    if (activeTab === "login") {
      // Simulação da validação do sistema
      if (email === "voluntario@exemplo.com" && password === "123") {
        onLoginSuccess();
      } else {
        // Implementação das Exceções do Caso de Uso:
        // 1. Usuário inexistente ou 2. Senha incorreta
        setError("E-mail ou senha incorretos. Por favor, tente novamente.");
      }
    } else {
      alert("Funcionalidade de cadastro não implementada na demo.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FFF5F8] p-4 font-sans">
      
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-20 h-20 bg-[#E91E63] rounded-[22px] flex items-center justify-center mb-4 shadow-sm">
          <Flower2 size={48} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#E91E63] mb-1">Cuidado Floral</h1>
        <p className="text-sm text-[#8B7B7D]">
          Rede Feminina de Combate ao Câncer de Mama - Itapema
        </p>
      </div>

      <div className="w-full max-w-[480px] bg-white rounded-[40px] p-8 shadow-[0_10px_40px_-15px_rgba(233,30,99,0.1)] border border-pink-50">
        <div className="text-center mb-8">
          <h2 className="text-[#E91E63] font-semibold text-lg mb-1">Bem-vinda ao Sistema</h2>
          <p className="text-sm text-[#8B7B7D]">Faça login ou cadastre-se para continuar</p>
        </div>

        <div className="flex bg-[#F5E6E8] p-1.5 rounded-full mb-8">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "login" ? "bg-white text-black shadow-sm" : "text-[#8B7B7D]"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "register" ? "bg-white text-black shadow-sm" : "text-[#8B7B7D]"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Exibição visual do erro (Fluxo de Exceção) */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in zoom-in duration-300">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-black ml-1">Nome Completo</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E91E63]" />
                <Input 
                  placeholder="Seu nome completo" 
                  className="pl-12 h-14 rounded-full border-pink-100 bg-[#FFF9FB] text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-black ml-1">E-mail</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E91E63]" />
              <Input 
                type="email"
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 rounded-full border-pink-100 bg-[#FFF9FB] text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-black ml-1">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E91E63]" />
              <Input 
                type="password"
                placeholder="sua senha" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 rounded-full border-pink-100 bg-[#FFF9FB] text-sm"
                required
              />
            </div>
            {activeTab === "login" && (
              <div className="flex justify-end">
                <button type="button" className="text-xs font-semibold text-[#E91E63] hover:underline">
                  Esqueci minha senha
                </button>
              </div>
            )}
          </div>

          {activeTab === "register" && (
            <div className="space-y-4 pt-2">
              <p className="text-sm font-bold text-black ml-1">Cadastrar-se como:</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Paciente", icon: User },
                  { label: "Doador", icon: Heart },
                  { label: "Voluntária", icon: Flower2 }
                ].map((perfil) => (
                  <button
                    key={perfil.label}
                    type="button"
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-pink-100 bg-[#FFF9FB] hover:border-[#E91E63] transition-colors group"
                  >
                    <perfil.icon size={20} className="text-[#E91E63] mb-1" />
                    <span className="text-[10px] font-bold text-[#8B7B7D] group-hover:text-[#E91E63]">{perfil.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button 
            type="submit"
            className="w-full h-14 rounded-full bg-[#E91E63] hover:bg-[#C2185B] text-white font-bold text-lg shadow-md shadow-pink-100 transition-transform active:scale-[0.98]"
          >
            {activeTab === "login" ? "Entrar" : "Criar Conta"}
          </Button>
        </form>
      </div>
    </div>
  );
}