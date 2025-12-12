"""
Сервис для работы с Cloud.ru Evolution Foundation Model
"""
import os
import json
import requests
from pathlib import Path
from openai import OpenAI
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Загружаем .env из директории backend
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
# Также пробуем загрузить из текущей директории
load_dotenv()


class LLMService:
    """Сервис для взаимодействия с Cloud.ru Evolution Foundation Model"""
    
    def __init__(self):
        api_key = os.getenv("CLOUD_RU_API_KEY")
        base_url = os.getenv("CLOUD_RU_API_BASE_URL", "https://foundation-models.api.cloud.ru/v1")
        # По умолчанию используем модель из рабочего curl запроса
        model_name = os.getenv("CLOUD_RU_MODEL", "openai/gpt-oss-120b")
        self.api_key = api_key
        self.base_url = base_url
        self.model = model_name
        
        if not api_key:
            raise ValueError("CLOUD_RU_API_KEY не установлен в переменных окружения")
        
        # Используем OpenAI-совместимый клиент
        self.client = OpenAI(
            base_url=base_url,
            api_key=api_key
        )
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 300,
        top_p: Optional[float] = None,
        frequency_penalty: Optional[float] = None,
        presence_penalty: Optional[float] = None
    ) -> str:
        """
        Генерирует ответ от LLM
        
        Args:
            prompt: Пользовательский промпт
            system_prompt: Системный промпт (опционально)
            temperature: Температура генерации
            max_tokens: Максимальное количество токенов
        
        Returns:
            Сгенерированный текст
        """
        # Используем OpenAI клиент (совместимый формат)
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            error_msg = str(e)
            # Более информативные сообщения об ошибках
            if "404" in error_msg or "Not Found" in error_msg:
                raise Exception(
                    f"Модель или endpoint не найдены (404).\n"
                    f"Проверьте:\n"
                    f"  - base_url: {self.base_url}\n"
                    f"  - model: {self.model}\n"
                    f"  - API ключ установлен: {'Да' if self.api_key else 'Нет'}"
                )
            elif "401" in error_msg or "Unauthorized" in error_msg:
                raise Exception(
                    "Ошибка аутентификации (401).\n"
                    "Проверьте правильность CLOUD_RU_API_KEY в файле .env"
                )
            elif "403" in error_msg or "Forbidden" in error_msg:
                raise Exception(
                    "Доступ запрещен (403).\n"
                    "API ключ не имеет доступа к Evolution Foundation Model.\n"
                    "Проверьте права доступа в личном кабинете Cloud.ru"
                )
            elif "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                raise Exception(
                    "Таймаут подключения.\n"
                    "Проверьте подключение к интернету и повторите попытку."
                )
            else:
                raise Exception(f"Ошибка при генерации: {error_msg}")
    
    
    async def generate_batch(
        self,
        prompts: list[str],
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4000
    ) -> list[str]:
        """
        Генерирует ответы для нескольких промптов
        
        Args:
            prompts: Список промптов
            system_prompt: Системный промпт
            temperature: Температура генерации
            max_tokens: Максимальное количество токенов
        
        Returns:
            Список сгенерированных текстов
        """
        results = []
        for prompt in prompts:
            result = await self.generate(prompt, system_prompt, temperature, max_tokens)
            results.append(result)
        return results

