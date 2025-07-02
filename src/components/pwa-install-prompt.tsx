'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt(): JSX.Element | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState<boolean>(false)
  const [isIOS, setIsIOS] = useState<boolean>(false)
  const [isInstalled, setIsInstalled] = useState<boolean>(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches

    setIsInstalled(isStandalone || isInWebAppiOS || isInWebAppChrome)

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after 3 seconds delay
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      console.log('PWA was installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async (): Promise<void> => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setShowPrompt(false)
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  const handleDismiss = (): void => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Don't show if already installed or dismissed this session
  if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null
  }

  // Show different prompt for iOS
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm pwa-slide-in">
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg mirai-gradient flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Install Mirai POS
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>
                </p>
                <div className="flex items-center mt-3 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDismiss}
                    className="text-xs px-3 py-1.5 h-auto"
                  >
                    Nanti
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show Android/Desktop install prompt
  if (deferredPrompt && showPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm pwa-slide-in">
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg mirai-gradient flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Install Mirai Project POS
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Install aplikasi untuk akses yang lebih cepat dan mudah
                </p>
                <div className="flex items-center mt-3 space-x-2">
                  <Button
                    size="sm"
                    onClick={handleInstallClick}
                    className="mirai-gradient text-xs px-3 py-1.5 h-auto"
                  >
                    Install App
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDismiss}
                    className="text-xs px-3 py-1.5 h-auto"
                  >
                    Nanti
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
