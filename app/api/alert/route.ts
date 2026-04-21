import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

export async function POST(request: NextRequest) {
  try {
    const { email, origin, destination, maxPrice } = await request.json() as {
      email: string
      origin: string
      destination?: string
      maxPrice?: number
    }

    if (!email || !origin) {
      return NextResponse.json({ error: 'email and origin are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    sgMail.setApiKey(apiKey)

    const dest = destination ?? 'anywhere'
    const priceText = maxPrice ? ` under $${maxPrice}` : ''

    await sgMail.send({
      to: email,
      from: 'alerts@farely.app',
      subject: `Farely Alert Set: ${origin} → ${dest}${priceText}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0f; color: #f0f0f5;">
          <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Your price alert is active ✈️</h1>
          <p style="color: #8888a0; margin-bottom: 24px;">We'll notify you when we find deals matching your criteria.</p>

          <div style="background: #13131a; border: 1px solid #2a2a3a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="margin-bottom: 12px;">
              <span style="color: #8888a0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Route</span>
              <p style="font-size: 18px; font-weight: 600; margin: 4px 0;">${origin} → ${dest}</p>
            </div>
            ${maxPrice ? `
            <div>
              <span style="color: #8888a0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Max Price</span>
              <p style="font-size: 18px; font-weight: 600; margin: 4px 0; color: #1D9E75;">$${maxPrice}</p>
            </div>
            ` : ''}
          </div>

          <p style="color: #8888a0; font-size: 14px;">
            To manage your alerts, reply to this email or visit <a href="https://farely.app" style="color: #1D9E75;">farely.app</a>.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Alert created successfully' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
